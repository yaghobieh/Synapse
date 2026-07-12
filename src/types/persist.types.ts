export interface StorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

export type StorageKind = 'local' | 'session' | 'memory';

export type StorageInput = StorageKind | StorageAdapter;

export type PersistMigrate = (persistedState: unknown, version: number) => unknown;

export interface PersistedEnvelope {
  state: Record<string, unknown>;
  version: number;
  timestamp: number;
}

export interface AttachPersistenceOptions<T extends object = object> {
  key: string;
  storage?: StorageInput;
  namespace?: string;
  include?: (keyof T)[];
  exclude?: (keyof T)[];
  version?: number;
  migrate?: PersistMigrate;
  debounceMs?: number;
  serialize?: (data: unknown) => string;
  deserialize?: (raw: string) => unknown;
}

export interface PersistHandle {
  rehydrated: Promise<void>;
  flush: () => void;
  clear: () => void;
  stop: () => void;
}
