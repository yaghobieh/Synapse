/**
 * Synapse - Middleware
 * Built-in middleware implementations
 */

import type { Action, AnyAction } from "@types/action.types";
import type { 
  Middleware, 
  MiddlewareAPI,
  LoggerMiddlewareOptions,
  ThunkMiddlewareOptions,
} from "@types/middleware.types";
import type { Dispatch, State } from "@types/store.types";
import { logger } from "@utils/logger";
import { isFunction, isPromise } from "@utils/helpers";
import { getConfig } from "@config/configLoader";
import { ACTION_PREFIX_START, ACTION_PREFIX_END } from "@consts/strings";

/**
 * Logger middleware - logs actions and state changes
 */
export function loggerMiddleware<S = State, A extends Action = AnyAction>(
  options: LoggerMiddlewareOptions = {}
): Middleware<S, A> {
  const {
    collapsed = true,
    diff = false,
    duration = true,
    timestamp = true,
    colors = {
      title: "#808080",
      prevState: "#9E9E9E",
      action: "#03A9F4",
      nextState: "#4CAF50",
    },
  } = options;

  return (api: MiddlewareAPI<S, A>) => (next: Dispatch<A>) => (action: A): A => {
    const config = getConfig();
    if (!config?.debug?.enabled || !config?.debug?.logger) {
      return next(action);
    }

    const startTime = Date.now();
    const prevState = api.getState();

    const result = next(action);

    const endTime = Date.now();
    const nextState = api.getState();

    const actionType = (action as AnyAction).type || "Unknown";
    const durationMs = endTime - startTime;
    const timeStr = timestamp ? `@ ${new Date().toISOString()}` : "";
    const durationStr = duration ? `(${durationMs}ms)` : "";

    const title = `action ${actionType} ${timeStr} ${durationStr}`;

    if (collapsed) {
      logger.groupCollapsed(title);
    } else {
      logger.group(title);
    }

    logger.info(`%cprev state`, `color: ${colors.prevState}`, prevState);
    logger.info(`%caction`, `color: ${colors.action}`, action);
    logger.info(`%cnext state`, `color: ${colors.nextState}`, nextState);

    if (diff) {
      logger.info("diff:", getDiff(prevState, nextState));
    }

    logger.groupEnd();

    return result;
  };
}

/**
 * Get diff between two states (simple implementation)
 */
function getDiff<S>(prevState: S, nextState: S): Record<string, { prev: unknown; next: unknown }> {
  const diff: Record<string, { prev: unknown; next: unknown }> = {};

  if (typeof prevState !== "object" || typeof nextState !== "object") {
    return diff;
  }

  const allKeys = new Set([
    ...Object.keys(prevState as object),
    ...Object.keys(nextState as object),
  ]);

  for (const key of allKeys) {
    const prev = (prevState as Record<string, unknown>)[key];
    const next = (nextState as Record<string, unknown>)[key];
    if (prev !== next) {
      diff[key] = { prev, next };
    }
  }

  return diff;
}

/**
 * Thunk middleware - enables async actions
 */
export function thunkMiddleware<
  S = State,
  A extends Action = AnyAction,
  E = undefined
>(options: ThunkMiddlewareOptions<E> = {}): Middleware<S, A> {
  const { extraArgument } = options;

  return (api: MiddlewareAPI<S, A>) => (next: Dispatch<A>) => (action: A): A => {
    // Handle thunk functions
    if (isFunction(action)) {
      return (action as unknown as (
        dispatch: Dispatch<A>,
        getState: () => S,
        extra: E
      ) => A)(api.dispatch, api.getState, extraArgument as E);
    }

    // Handle promises
    if (isPromise(action)) {
      return (action as unknown as Promise<A>).then(api.dispatch) as unknown as A;
    }

    return next(action);
  };
}

/**
 * Dispatch actions middleware - adds START and END actions
 */
export function dispatchActionsMiddleware<S = State, A extends Action = AnyAction>(): Middleware<S, A> {
  return (api: MiddlewareAPI<S, A>) => (next: Dispatch<A>) => (action: A): A => {
    const config = getConfig();
    const dispatchConfig = config?.dispatch;

    if (!dispatchConfig?.startAction && !dispatchConfig?.endAction) {
      return next(action);
    }

    const actionType = (action as AnyAction).type;
    
    // Skip internal actions
    if (actionType?.startsWith("@@synapse/")) {
      return next(action);
    }

    const startSuffix = dispatchConfig.startSuffix || ACTION_PREFIX_START;
    const endSuffix = dispatchConfig.endSuffix || ACTION_PREFIX_END;

    // Dispatch START action
    if (dispatchConfig.startAction) {
      api.dispatch({
        type: `${actionType}${startSuffix}`,
        payload: (action as AnyAction).payload,
        meta: { originalAction: action },
      } as unknown as A);
    }

    // Dispatch original action
    const result = next(action);

    // Dispatch END action
    if (dispatchConfig.endAction) {
      api.dispatch({
        type: `${actionType}${endSuffix}`,
        payload: (action as AnyAction).payload,
        meta: { originalAction: action },
      } as unknown as A);
    }

    return result;
  };
}

/**
 * Crash reporter middleware - catches and reports errors
 */
export function crashReporterMiddleware<S = State, A extends Action = AnyAction>(
  onError?: (error: Error, action: A, state: S) => void
): Middleware<S, A> {
  return (api: MiddlewareAPI<S, A>) => (next: Dispatch<A>) => (action: A): A => {
    try {
      return next(action);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Caught an exception!", err);
      
      if (onError) {
        onError(err, action, api.getState());
      }
      
      throw error;
    }
  };
}

/**
 * DevTools middleware - connects to Synapse DevTools
 */
export function devToolsMiddleware<S = State, A extends Action = AnyAction>(): Middleware<S, A> {
  const devToolsExtension = typeof window !== "undefined"
    ? (window as unknown as { __SYNAPSE_DEVTOOLS__?: { send: (action: A, state: S) => void } }).__SYNAPSE_DEVTOOLS__
    : undefined;

  return (api: MiddlewareAPI<S, A>) => (next: Dispatch<A>) => (action: A): A => {
    const result = next(action);

    if (devToolsExtension) {
      devToolsExtension.send(action, api.getState());
    }

    return result;
  };
}

/**
 * Batch actions middleware
 */
export function batchMiddleware<S = State, A extends Action = AnyAction>(): Middleware<S, A> {
  return (api: MiddlewareAPI<S, A>) => (next: Dispatch<A>) => (action: A): A => {
    const actionType = (action as AnyAction).type;
    
    if (actionType === "@@synapse/BATCH") {
      const batchedActions = (action as AnyAction).payload as A[];
      batchedActions.forEach((batchedAction) => {
        api.dispatch(batchedAction);
      });
      return action;
    }

    return next(action);
  };
}

/**
 * Apply multiple middleware
 */
export function applyMiddleware<S = State, A extends Action = AnyAction>(
  ...middlewares: Middleware<S, A>[]
): Middleware<S, A>[] {
  return middlewares;
}

