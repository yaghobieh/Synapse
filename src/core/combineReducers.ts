/**
 * Synapse - Combine Reducers
 * Combine multiple reducers into a single reducer
 */

import type { Action, AnyAction, Reducer } from "@types/action.types";
import type { ReducersMapObject, State } from "@types/store.types";
import { isPlainObject, isFunction } from "@utils/helpers";
import { logger } from "@utils/logger";
import { SYNAPSE_INIT } from "@consts/actionTypes";

/**
 * Validate reducers map
 */
function validateReducers<S = State, A extends Action = AnyAction>(
  reducers: ReducersMapObject<S, A>
): void {
  const reducerKeys = Object.keys(reducers);

  for (const key of reducerKeys) {
    const reducer = reducers[key as keyof S];

    if (!isFunction(reducer)) {
      throw new Error(
        `[Synapse] No reducer provided for key "${key}". ` +
        `Expected a function but got: ${typeof reducer}`
      );
    }

    // Test that reducer returns initial state
    const initialState = reducer(undefined, { type: SYNAPSE_INIT } as A);
    if (typeof initialState === "undefined") {
      throw new Error(
        `[Synapse] Reducer for key "${key}" returned undefined during initialization. ` +
        "If the state passed to the reducer is undefined, you must explicitly return the initial state."
      );
    }
  }
}

/**
 * Get unexpected keys warning message
 */
function getUnexpectedStateShapeWarningMessage<S>(
  inputState: S,
  reducers: Record<string, Reducer>,
  action: Action
): string | undefined {
  const reducerKeys = Object.keys(reducers);
  const stateKeys = Object.keys(inputState as object);

  if (reducerKeys.length === 0) {
    return "[Synapse] Store has no reducers. " +
      "Make sure the argument passed to combineReducers is an object with valid reducers.";
  }

  if (!isPlainObject(inputState)) {
    return `[Synapse] The initial state has unexpected type: "${typeof inputState}". ` +
      "Expected an object with the following keys: " +
      `"${reducerKeys.join('", "')}"`;
  }

  const unexpectedKeys = stateKeys.filter(
    (key) => !Object.prototype.hasOwnProperty.call(reducers, key)
  );

  if (unexpectedKeys.length > 0) {
    return `[Synapse] Unexpected ${unexpectedKeys.length > 1 ? "keys" : "key"} ` +
      `"${unexpectedKeys.join('", "')}" found in state for action "${action.type}". ` +
      "Expected to find one of the known reducer keys instead: " +
      `"${reducerKeys.join('", "')}".`;
  }

  return undefined;
}

/**
 * Combine multiple reducers into a single reducer function
 */
export function combineReducers<S = State, A extends Action = AnyAction>(
  reducers: ReducersMapObject<S, A>
): Reducer<S, A> {
  // Filter out non-function values
  const finalReducers: Record<string, Reducer<unknown, A>> = {};
  const reducerKeys = Object.keys(reducers);

  for (const key of reducerKeys) {
    const reducer = reducers[key as keyof S];
    if (isFunction(reducer)) {
      finalReducers[key] = reducer as Reducer<unknown, A>;
    }
  }

  const finalReducerKeys = Object.keys(finalReducers);

  // Validate reducers
  try {
    validateReducers(reducers);
  } catch (error) {
    logger.error((error as Error).message);
    throw error;
  }

  return function combination(state: S | undefined, action: A): S {
    // Get initial state if undefined
    const inputState = state ?? ({} as S);

    // Check for unexpected state shape in development
    if (process.env.NODE_ENV !== "production") {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        inputState,
        finalReducers,
        action
      );
      if (warningMessage) {
        logger.warn(warningMessage);
      }
    }

    let hasChanged = false;
    const nextState: Record<string, unknown> = {};

    for (const key of finalReducerKeys) {
      const reducer = finalReducers[key];
      const previousStateForKey = (inputState as Record<string, unknown>)[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      if (typeof nextStateForKey === "undefined") {
        throw new Error(
          `[Synapse] Reducer for key "${key}" returned undefined when handling action "${action.type}". ` +
          "To ignore an action, you must explicitly return the previous state."
        );
      }

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    // Check if any keys were removed
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(inputState as object).length;

    return (hasChanged ? nextState : inputState) as S;
  };
}

/**
 * Create a reducer that handles multiple action types
 */
export function createReducer<S, A extends Action = AnyAction>(
  initialState: S,
  handlers: Record<string, (state: S, action: A) => S>
): Reducer<S, A> {
  return function reducer(state: S | undefined = initialState, action: A): S {
    const handler = handlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };
}

/**
 * Reduce reducers - run multiple reducers sequentially
 */
export function reduceReducers<S, A extends Action = AnyAction>(
  initialState: S,
  ...reducers: Reducer<S, A>[]
): Reducer<S, A> {
  return function reducer(state: S | undefined = initialState, action: A): S {
    return reducers.reduce(
      (currentState, r) => r(currentState, action),
      state
    );
  };
}

