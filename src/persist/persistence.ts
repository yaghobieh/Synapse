import type {
  AttachPersistenceOptions,
  Nucleus,
  PersistHandle,
  PersistedEnvelope,
  StorageAdapter,
  StorageInput,
} from '../types';
import { PERSIST_DEFAULTS, PERSIST_ERRORS, PERSIST_NUMBERS } from '../constants/persist.const';
import { resolveStorageAdapter } from './storage';

function buildStorageKey(key: string, namespace: string): string {
  return `${namespace}${key}`;
}

function filterPersistedState<T extends object>(
  state: T,
  include?: (keyof T)[],
  exclude?: (keyof T)[],
): Partial<T> {
  const result: Partial<T> = {};
  const keys = include ?? (Object.keys(state) as (keyof T)[]);

  for (const key of keys) {
    if (key in state && typeof state[key] !== 'function') {
      result[key] = state[key];
    }
  }

  if (exclude) {
    for (const key of exclude) {
      delete result[key];
    }
  }

  return result;
}

function pickExistingKeys<T extends object>(candidate: Partial<T>, current: T): Partial<T> {
  const safe: Partial<T> = {};
  for (const key of Object.keys(candidate as object) as (keyof T)[]) {
    if (key in current) {
      safe[key] = candidate[key];
    }
  }
  return safe;
}

export function attachPersistence<T extends object>(
  nucleus: Nucleus<T>,
  options: AttachPersistenceOptions<T>,
): PersistHandle {
  const {
    key,
    storage = PERSIST_DEFAULTS.STORAGE as StorageInput,
    namespace = PERSIST_DEFAULTS.NAMESPACE,
    include,
    exclude,
    version = PERSIST_DEFAULTS.VERSION,
    migrate,
    debounceMs = PERSIST_NUMBERS.DEBOUNCE_MS,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options;

  const adapter: StorageAdapter = resolveStorageAdapter(storage);
  const storageKey = buildStorageKey(key, namespace);

  let writeTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const cancelPendingWrite = () => {
    if (writeTimer) {
      clearTimeout(writeTimer);
      writeTimer = null;
    }
  };

  const writeNow = () => {
    cancelPendingWrite();
    try {
      const envelope: PersistedEnvelope = {
        state: filterPersistedState(nucleus.get(), include, exclude) as Record<string, unknown>,
        version,
        timestamp: Date.now(),
      };
      const result = adapter.setItem(storageKey, serialize(envelope));
      if (result instanceof Promise) {
        result.catch((error) => console.warn(PERSIST_ERRORS.SAVE, error));
      }
    } catch (error) {
      console.warn(PERSIST_ERRORS.SAVE, error);
    }
  };

  const scheduleWrite = () => {
    cancelPendingWrite();
    writeTimer = setTimeout(() => {
      writeTimer = null;
      writeNow();
    }, debounceMs);
  };

  const hydrate = async (): Promise<void> => {
    try {
      const raw = adapter.getItem(storageKey);
      const stored = raw instanceof Promise ? await raw : raw;
      if (!stored || stopped) return;

      const envelope = deserialize(stored) as Partial<PersistedEnvelope>;
      const storedVersion = envelope.version ?? PERSIST_DEFAULTS.VERSION;

      let candidate: Partial<T>;
      if (storedVersion !== version) {
        if (!migrate) return;
        candidate = migrate(envelope.state, storedVersion) as Partial<T>;
      } else {
        candidate = envelope.state as Partial<T>;
      }

      if (!candidate || typeof candidate !== 'object') return;

      nucleus.set(pickExistingKeys(candidate, nucleus.get()));
    } catch (error) {
      console.warn(PERSIST_ERRORS.HYDRATE, error);
    }
  };

  const rehydrated = hydrate();

  const unsubscribe = nucleus.subscribe(() => {
    scheduleWrite();
  });

  return {
    rehydrated,
    flush: writeNow,
    clear: () => {
      cancelPendingWrite();
      try {
        const result = adapter.removeItem(storageKey);
        if (result instanceof Promise) {
          result.catch((error) => console.warn(PERSIST_ERRORS.CLEAR, error));
        }
      } catch (error) {
        console.warn(PERSIST_ERRORS.CLEAR, error);
      }
    },
    stop: () => {
      stopped = true;
      cancelPendingWrite();
      unsubscribe();
    },
  };
}
