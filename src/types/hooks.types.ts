/**
 * Synapse - Hooks Types
 * Type definitions for React hooks
 */

import type { Action, AnyAction } from "./action.types";
import type { State } from "./store.types";

/**
 * Selector function type
 */
export type Selector<S = State, R = unknown> = (state: S) => R;

/**
 * Equality function for comparing selector results
 */
export type EqualityFn<T> = (a: T, b: T) => boolean;

/**
 * useSelector options
 */
export interface UseSelectorOptions<T> {
  /** Custom equality function */
  equalityFn?: EqualityFn<T>;
}

/**
 * useDispatch return type
 */
export type UseDispatchResult<A extends Action = AnyAction> = (action: A) => A;

/**
 * useAction hook options
 */
export interface UseActionOptions {
  /** Payload transformer */
  payloadTransformer?: (payload: unknown) => unknown;
}

/**
 * Bound action creator
 */
export type BoundActionCreator<P = void> = P extends void
  ? () => void
  : (payload: P) => void;

/**
 * Action status for tracking
 */
export interface ActionStatus {
  /** Whether action is currently pending */
  isPending: boolean;
  
  /** Whether action completed successfully */
  isSuccess: boolean;
  
  /** Whether action failed */
  isError: boolean;
  
  /** Error if action failed */
  error: Error | null;
  
  /** Timestamp of last action */
  timestamp: number | null;
}

/**
 * useActionStatus return type
 */
export interface UseActionStatusResult extends ActionStatus {
  /** Reset the status */
  reset: () => void;
}

/**
 * Store context value
 */
export interface StoreContextValue<S = State, A extends Action = AnyAction> {
  /** Get current state */
  getState: () => S;
  
  /** Dispatch action */
  dispatch: (action: A) => A;
  
  /** Subscribe to changes */
  subscribe: (listener: () => void) => () => void;
}

