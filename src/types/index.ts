/**
 * Synapse Types - Core type definitions
 */

import type { PersistMigrate, StorageAdapter, StorageInput } from './persist.types';

export type {
  StorageAdapter,
  StorageKind,
  StorageInput,
  PersistMigrate,
  PersistedEnvelope,
  AttachPersistenceOptions,
  PersistHandle,
} from './persist.types';

export type {
  MiddlewareHooks,
  ReduxDevtoolsOptions,
  ReduxDevtoolsMessage,
  ReduxDevtoolsConnection,
  ReduxDevtoolsExtension,
} from './middleware.types';

// ============================================================================
// NAMING CONVENTIONS
// ============================================================================

/**
 * Naming convention for actions/mutations
 */
export type NamingConvention = 'camelCase' | 'PascalCase' | 'snake_case' | 'SCREAMING_SNAKE_CASE';

/**
 * Synapse configuration options
 */
export interface SynapseConfig<T extends object = object> {
  /** Naming convention for actions (default: 'camelCase') */
  actionNaming?: NamingConvention;
  /** Action prefix (e.g., 'TRK' → 'TRK_ADD_TODO') */
  actionPrefix?: string;
  /** Enable devtools integration (default: true in development) */
  devtools?: boolean;
  /** Custom devtools name */
  devtoolsName?: string;
  /** Enable action logging (default: false) */
  logging?: boolean;
  /** Persist state to storage */
  persist?: PersistConfig | boolean;
  /** Middleware pipeline applied to every state update */
  middleware?: Middleware<T>[];
}

export interface PersistConfig {
  /** Storage key */
  key: string;
  /** Storage type: 'local' | 'session' | 'memory' | custom storage adapter */
  storage?: StorageInput;
  /** Key namespace prefix (default: 'synapse:') */
  namespace?: string;
  /** Properties to persist (undefined = all) */
  include?: string[];
  /** Properties to exclude from persistence */
  exclude?: string[];
  /** Persisted state schema version (default: 1) */
  version?: number;
  /** Migrate persisted state from an older version */
  migrate?: PersistMigrate;
  /** Debounced write delay in ms (default: PERSIST_NUMBERS.DEBOUNCE_MS) */
  debounceMs?: number;
  /** Custom serializer */
  serialize?: (state: unknown) => string;
  /** Custom deserializer */
  deserialize?: (data: string) => unknown;
}

// ============================================================================
// NUCLEUS (STATE CONTAINER) TYPES
// ============================================================================

/**
 * A Nucleus is the core state container in Synapse
 * (Replaces "store" from Redux/Zustand)
 */
export interface Nucleus<T extends object = object> {
  /** Get current state */
  get: () => T;
  /** Set state (partial or full) */
  set: SetState<T>;
  /** Subscribe to state changes */
  subscribe: (listener: Listener<T>) => Unsubscribe;
  /** Get a specific property */
  pick: <K extends keyof T>(key: K) => T[K];
  /** Reset to initial state */
  reset: () => void;
  /** Destroy the nucleus and cleanup */
  destroy: () => void;
}

/**
 * SetState function type - can be partial state or updater function
 */
export type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean
) => void;

/**
 * Listener for state changes
 */
export type Listener<T> = (state: T, prevState: T) => void;

/**
 * Unsubscribe function
 */
export type Unsubscribe = () => void;

/**
 * State initializer function
 */
export type StateInitializer<T extends object> = (
  set: SetState<T>,
  get: () => T,
  nucleus: Nucleus<T>
) => T;

// ============================================================================
// SIGNAL TYPES (REACTIVE STATE)
// ============================================================================

/**
 * A Signal is a reactive value that automatically triggers re-renders
 */
export interface Signal<T> {
  /** Get the current value */
  value: T;
  /** Set a new value */
  set: (value: T | ((prev: T) => T)) => void;
  /** Subscribe to changes */
  subscribe: (listener: (value: T, prev: T) => void) => Unsubscribe;
  /** Peek at value without subscribing */
  peek: () => T;
}

/**
 * Computed signal - derived from other signals
 */
export interface ComputedSignal<T> {
  /** Get the computed value */
  readonly value: T;
  /** Subscribe to changes */
  subscribe: (listener: (value: T) => void) => Unsubscribe;
}

// ============================================================================
// ACTION TYPES
// ============================================================================

/**
 * Action definition
 */
export interface Action<TPayload = void, TResult = void> {
  /** Action type/name */
  type: string;
  /** Execute the action */
  (payload: TPayload): TResult;
}

/**
 * Async action definition
 */
export interface AsyncAction<TPayload = void, TResult = void> {
  type: string;
  (payload: TPayload): Promise<TResult>;
  /** Loading state */
  loading: Signal<boolean>;
  /** Error state */
  error: Signal<Error | null>;
}

/**
 * Actions creator return type
 */
export type Actions<T extends object> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : never;
};

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

/**
 * Middleware function type
 */
export type Middleware<T extends object = object> = (
  config: MiddlewareConfig<T>
) => (
  set: SetState<T>,
  get: () => T,
  nucleus: Nucleus<T>
) => SetState<T>;

export interface MiddlewareConfig<T extends object = object> {
  /** Current nucleus */
  nucleus: Nucleus<T>;
  /** Initial state */
  initialState: T;
  /** Synapse config */
  config: SynapseConfig<T>;
}

/**
 * Logger middleware options
 */
export interface LoggerOptions {
  /** Log action names */
  actions?: boolean;
  /** Log state diffs */
  diff?: boolean;
  /** Log timestamp */
  timestamp?: boolean;
  /** Custom logger function */
  logger?: (message: string, data?: unknown) => void;
}

/**
 * Persist middleware options
 */
export interface PersistOptions<T extends object = object> {
  key: string;
  storage?: StorageInput;
  namespace?: string;
  include?: (keyof T)[];
  exclude?: (keyof T)[];
  version?: number;
  migrate?: (persistedState: unknown, version: number) => T;
  debounceMs?: number;
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

/**
 * useNucleus hook return type
 */
export type UseNucleus<T extends object> = T & {
  /** Set state */
  $set: SetState<T>;
  /** Reset to initial */
  $reset: () => void;
};

/**
 * Selector function type
 */
export type Selector<T, R> = (state: T) => R;

// ============================================================================
// API MANAGER TYPES
// ============================================================================

/**
 * API request configuration
 */
export interface ApiConfig {
  /** Base URL for all requests */
  baseUrl?: string;
  /** Default headers */
  headers?: Record<string, string>;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Transform response data */
  transformResponse?: <T>(data: unknown) => T;
  /** Transform request data */
  transformRequest?: <T>(data: T) => unknown;
}

export interface RetryConfig {
  /** Number of retries */
  count: number;
  /** Delay between retries in ms */
  delay: number;
  /** Exponential backoff multiplier */
  backoff?: number;
}

/**
 * API endpoint definition
 */
export interface ApiEndpoint<TParams = void, TResponse = unknown> {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** URL path (can include :params) */
  path: string;
  /** Request handler */
  (params: TParams): Promise<TResponse>;
}

/**
 * API query state
 */
export interface QueryState<T> {
  /** Response data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Is data stale */
  stale: boolean;
  /** Last fetch timestamp */
  fetchedAt: number | null;
  /** Refetch function */
  refetch: () => Promise<void>;
}

/**
 * Mutation state
 */
export interface MutationState<T> {
  /** Response data */
  data: T | null;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Reset mutation state */
  reset: () => void;
}

// ============================================================================
// DEVTOOLS TYPES
// ============================================================================

/**
 * DevTools message types
 */
export type DevToolsMessageType =
  | 'INIT'
  | 'STATE_CHANGE'
  | 'ACTION'
  | 'TIME_TRAVEL'
  | 'RESET'
  | 'IMPORT_STATE'
  | 'EXPORT_STATE';

export interface DevToolsMessage {
  type: DevToolsMessageType;
  payload: unknown;
  timestamp: number;
  nucleusId: string;
}

export interface DevToolsState {
  nuclei: Record<string, {
    name: string;
    state: unknown;
    actions?: string[];
    history: Array<{
      state: unknown;
      action: string;
      timestamp: number;
    }>;
  }>;
}

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export type Storage = StorageAdapter;

