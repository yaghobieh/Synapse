/**
 * Synapse - Middleware Types
 * Type definitions for middleware functionality
 */

import type { Action, AnyAction } from "./action.types";
import type { Dispatch, GetState, State } from "./store.types";

/**
 * Middleware API passed to each middleware
 */
export interface MiddlewareAPI<S = State, A extends Action = AnyAction> {
  dispatch: Dispatch<A>;
  getState: GetState<S>;
}

/**
 * Middleware function type
 */
export type Middleware<S = State, A extends Action = AnyAction> = (
  api: MiddlewareAPI<S, A>
) => (next: Dispatch<A>) => (action: A) => A;

/**
 * Composed middleware type
 */
export type ComposedMiddleware<S = State, A extends Action = AnyAction> = (
  next: Dispatch<A>
) => Dispatch<A>;

/**
 * Middleware options
 */
export interface MiddlewareOptions {
  /** Middleware name for debugging */
  name?: string;
  
  /** Whether middleware should run in debug mode only */
  debugOnly?: boolean;
}

/**
 * Logger middleware options
 */
export interface LoggerMiddlewareOptions extends MiddlewareOptions {
  /** Log state diff */
  diff?: boolean;
  
  /** Collapse console groups */
  collapsed?: boolean;
  
  /** Custom logger function */
  logger?: typeof console;
  
  /** Duration logging */
  duration?: boolean;
  
  /** Timestamp format */
  timestamp?: boolean;
  
  /** Colors for console output */
  colors?: {
    title?: string;
    prevState?: string;
    action?: string;
    nextState?: string;
  };
}

/**
 * Thunk middleware options
 */
export interface ThunkMiddlewareOptions<E = undefined> {
  /** Extra argument passed to thunks */
  extraArgument?: E;
}

/**
 * API middleware options
 */
export interface ApiMiddlewareOptions {
  /** Base URL for API calls */
  baseURL?: string;
  
  /** Default headers */
  headers?: Record<string, string>;
  
  /** Timeout in milliseconds */
  timeout?: number;
  
  /** Retry configuration */
  retry?: {
    attempts: number;
    delay: number;
  };
}

