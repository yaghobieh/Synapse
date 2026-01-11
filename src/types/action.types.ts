/**
 * Synapse - Action Types
 * Type definitions for actions and reducers
 */

/**
 * Base action interface
 */
export interface Action<T = string> {
  type: T;
}

/**
 * Action with payload
 */
export interface PayloadAction<P = unknown, T = string> extends Action<T> {
  payload: P;
}

/**
 * Action with optional meta
 */
export interface MetaAction<P = unknown, M = unknown, T = string> extends PayloadAction<P, T> {
  meta?: M;
}

/**
 * Action with error
 */
export interface ErrorAction<E = Error, T = string> extends Action<T> {
  error: true;
  payload: E;
}

/**
 * Any action type
 */
export interface AnyAction extends Action {
  [extraProps: string]: unknown;
}

/**
 * Reducer function type
 */
export type Reducer<S = unknown, A extends Action = AnyAction> = (
  state: S | undefined,
  action: A
) => S;

/**
 * Action creator function type
 */
export type ActionCreator<A extends Action = AnyAction> = (...args: unknown[]) => A;

/**
 * Payload action creator
 */
export type PayloadActionCreator<P = void, T = string> = P extends void
  ? () => PayloadAction<undefined, T>
  : (payload: P) => PayloadAction<P, T>;

/**
 * Case reducer function for createSlice
 */
export type CaseReducer<S = unknown, A extends PayloadAction = PayloadAction> = (
  state: S,
  action: A
) => S | void;

/**
 * Case reducers map
 */
export type CaseReducers<S, A extends PayloadAction = PayloadAction> = {
  [K: string]: CaseReducer<S, A>;
};

/**
 * Action case configuration
 */
export enum ActionCase {
  UPPER_SNAKE = "UPPER_SNAKE",
  LOWER_SNAKE = "lower_snake",
  CAMEL_CASE = "camelCase",
  KEBAB_CASE = "kebab-case",
}

/**
 * Thunk action type (for async actions)
 */
export type ThunkAction<R, S, E, A extends Action> = (
  dispatch: (action: A | ThunkAction<R, S, E, A>) => R,
  getState: () => S,
  extraArgument: E
) => R;

/**
 * Batch action containing multiple actions
 */
export interface BatchAction extends Action<"@@synapse/BATCH"> {
  payload: AnyAction[];
}

