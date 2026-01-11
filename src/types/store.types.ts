/**
 * Synapse - Store Types
 * Type definitions for store-related functionality
 */

import type { Action, AnyAction, Reducer } from "./action.types";
import type { Middleware } from "./middleware.types";

/**
 * Store state - can be any object shape
 */
export type State = Record<string, unknown>;

/**
 * Listener function called when state changes
 */
export type Listener = () => void;

/**
 * Unsubscribe function returned by subscribe
 */
export type Unsubscribe = () => void;

/**
 * Dispatch function type
 */
export type Dispatch<A extends Action = AnyAction> = (action: A) => A;

/**
 * GetState function type
 */
export type GetState<S = State> = () => S;

/**
 * Store interface
 */
export interface Store<S = State, A extends Action = AnyAction> {
  /** Get current state */
  getState: GetState<S>;
  
  /** Dispatch an action */
  dispatch: Dispatch<A>;
  
  /** Subscribe to state changes */
  subscribe: (listener: Listener) => Unsubscribe;
  
  /** Replace the current reducer */
  replaceReducer: (nextReducer: Reducer<S, A>) => void;
  
  /** Get the current reducer */
  getReducer: () => Reducer<S, A>;
}

/**
 * Store creator function type
 */
export type StoreCreator<S = State, A extends Action = AnyAction> = (
  reducer: Reducer<S, A>,
  preloadedState?: S
) => Store<S, A>;

/**
 * Store enhancer type
 */
export type StoreEnhancer<S = State, A extends Action = AnyAction> = (
  createStore: StoreCreator<S, A>
) => StoreCreator<S, A>;

/**
 * Options for creating a store
 */
export interface CreateStoreOptions<S = State, A extends Action = AnyAction> {
  /** Initial state */
  preloadedState?: S;
  
  /** Array of middleware to apply */
  middleware?: Middleware<S, A>[];
  
  /** Store enhancers */
  enhancers?: StoreEnhancer<S, A>[];
  
  /** Enable DevTools integration */
  devTools?: boolean;
  
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Reducers map object for combineReducers
 */
export type ReducersMapObject<S = State, A extends Action = AnyAction> = {
  [K in keyof S]: Reducer<S[K], A>;
};

/**
 * Slice configuration
 */
export interface SliceConfig<S, A extends Action = AnyAction> {
  /** Slice name */
  name: string;
  
  /** Initial state */
  initialState: S;
  
  /** Reducers map */
  reducers: Record<string, (state: S, action: A) => S>;
}

/**
 * Slice object returned by createSlice
 */
export interface Slice<S = State, A extends Action = AnyAction> {
  /** Slice name */
  name: string;
  
  /** Reducer function */
  reducer: Reducer<S, A>;
  
  /** Action creators */
  actions: Record<string, (payload?: unknown) => A>;
  
  /** Initial state */
  getInitialState: () => S;
}

