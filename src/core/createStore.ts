/**
 * Synapse - Create Store
 * Main store creation functionality
 */

import { SYNAPSE_INIT } from "@consts/actionTypes";
import type { Action, AnyAction, Reducer } from "@types";
import type { Middleware, MiddlewareAPI } from "@types";
import type {
  CreateStoreOptions,
  Dispatch,
  GetState,
  Listener,
  State,
  Store,
  Unsubscribe,
} from "@types";
import { logger } from "@utils/logger";
import { isFunction, isPlainObject } from "@utils/helpers";

/**
 * Compose middleware functions
 */
function composeMiddleware<S = State, A extends Action = AnyAction>(
  middlewares: Middleware<S, A>[],
  api: MiddlewareAPI<S, A>
): (dispatch: Dispatch<A>) => Dispatch<A> {
  if (middlewares.length === 0) {
    return (dispatch: Dispatch<A>) => dispatch;
  }

  const chain = middlewares.map((middleware) => middleware(api));

  return (dispatch: Dispatch<A>) => {
    return chain.reduceRight(
      (next, middleware) => middleware(next),
      dispatch
    );
  };
}

/**
 * Create a Synapse store
 */
export function createStore<S = State, A extends Action = AnyAction>(
  reducer: Reducer<S, A>,
  options: CreateStoreOptions<S, A> = {}
): Store<S, A> {
  const {
    preloadedState,
    middleware = [],
    devTools = true,
    debug = false,
  } = options;

  // Validate reducer
  if (!isFunction(reducer)) {
    throw new Error("[Synapse] Expected reducer to be a function");
  }

  // Configure logger
  if (debug) {
    logger.configure({ enabled: true, logger: true });
  }

  let currentReducer = reducer;
  let currentState: S = preloadedState as S;
  let listeners: Set<Listener> = new Set();
  let isDispatching = false;

  /**
   * Get current state
   */
  const getState: GetState<S> = () => {
    if (isDispatching) {
      throw new Error(
        "[Synapse] Cannot call getState while dispatching. " +
        "Use middleware or thunks for async operations."
      );
    }
    return currentState;
  };

  /**
   * Subscribe to state changes
   */
  const subscribe = (listener: Listener): Unsubscribe => {
    if (!isFunction(listener)) {
      throw new Error("[Synapse] Expected listener to be a function");
    }

    if (isDispatching) {
      throw new Error(
        "[Synapse] Cannot subscribe while dispatching."
      );
    }

    listeners.add(listener);

    return () => {
      if (isDispatching) {
        throw new Error(
          "[Synapse] Cannot unsubscribe while dispatching."
        );
      }
      listeners.delete(listener);
    };
  };

  /**
   * Base dispatch function
   */
  const baseDispatch: Dispatch<A> = (action: A): A => {
    if (!isPlainObject(action)) {
      throw new Error(
        "[Synapse] Actions must be plain objects. " +
        "Use middleware for async actions."
      );
    }

    if (typeof action.type === "undefined") {
      throw new Error(
        "[Synapse] Actions must have a type property."
      );
    }

    if (isDispatching) {
      throw new Error(
        "[Synapse] Reducers may not dispatch actions."
      );
    }

    try {
      isDispatching = true;
      const prevState = currentState;
      currentState = currentReducer(currentState, action);

      logger.logAction(
        action as { type: string; payload?: unknown },
        prevState,
        currentState
      );
    } finally {
      isDispatching = false;
    }

    // Notify listeners
    listeners.forEach((listener) => listener());

    return action;
  };

  /**
   * Replace the current reducer
   */
  const replaceReducer = (nextReducer: Reducer<S, A>): void => {
    if (!isFunction(nextReducer)) {
      throw new Error("[Synapse] Expected nextReducer to be a function");
    }
    currentReducer = nextReducer;
    dispatch({ type: SYNAPSE_INIT } as A);
  };

  /**
   * Get the current reducer
   */
  const getReducer = (): Reducer<S, A> => {
    return currentReducer;
  };

  // Create middleware API
  const middlewareAPI: MiddlewareAPI<S, A> = {
    getState,
    dispatch: (action: A) => dispatch(action),
  };

  // Apply middleware
  const dispatch = composeMiddleware(middleware, middlewareAPI)(baseDispatch);

  // Connect to DevTools if available and enabled
  if (devTools && typeof window !== "undefined") {
    connectDevTools(getState, dispatch);
  }

  // Initialize store
  dispatch({ type: SYNAPSE_INIT } as A);

  return {
    getState,
    dispatch,
    subscribe,
    replaceReducer,
    getReducer,
  };
}

/**
 * Connect to Synapse DevTools extension
 */
function connectDevTools<S, A extends Action>(
  getState: GetState<S>,
  dispatch: Dispatch<A>
): void {
  try {
    // Check for Synapse DevTools
    const devToolsExtension = (window as unknown as {
      __SYNAPSE_DEVTOOLS__?: {
        connect: (options: { getState: GetState<S>; dispatch: Dispatch<A> }) => void;
      };
    }).__SYNAPSE_DEVTOOLS__;

    if (devToolsExtension) {
      devToolsExtension.connect({ getState, dispatch });
      logger.info("Connected to Synapse DevTools");
    }

    // Also support Redux DevTools as fallback
    const reduxDevTools = (window as unknown as {
      __REDUX_DEVTOOLS_EXTENSION__?: {
        connect: () => { init: (state: S) => void };
      };
    }).__REDUX_DEVTOOLS_EXTENSION__;

    if (reduxDevTools && !devToolsExtension) {
      const devTools = reduxDevTools.connect();
      devTools.init(getState());
      logger.info("Connected to Redux DevTools (fallback)");
    }
  } catch {
    // Silently ignore DevTools connection errors
  }
}

/**
 * Create store with default configuration
 */
export function configureStore<S = State, A extends Action = AnyAction>(
  options: {
    reducer: Reducer<S, A> | Record<string, Reducer<unknown, A>>;
    preloadedState?: S;
    middleware?: Middleware<S, A>[];
    devTools?: boolean;
    debug?: boolean;
  }
): Store<S, A> {
  const { reducer, ...storeOptions } = options;

  // If reducer is an object, combine them
  let rootReducer: Reducer<S, A>;
  if (isPlainObject(reducer)) {
    // Import dynamically to avoid circular dependency
    const { combineReducers } = require("./combineReducers");
    rootReducer = combineReducers(reducer as Record<string, Reducer<unknown, A>>) as Reducer<S, A>;
  } else {
    rootReducer = reducer as Reducer<S, A>;
  }

  return createStore(rootReducer, storeOptions);
}

