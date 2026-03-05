/**
 * Persist Middleware — Save & restore nucleus state to storage.
 *
 * Supports localStorage, sessionStorage, and custom (including async) storages.
 */

import type { Middleware, PersistOptions, SetState, Storage } from '../types';
import { PERSIST_KEY_PREFIX, NUMBERS } from '../constants';

const DEFAULT_VERSION = 1;

function getStorage(storage: 'local' | 'session' | Storage = 'local'): Storage {
  if (typeof storage === 'string') {
    if (typeof window === 'undefined') {
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
    }
    return storage === 'local' ? localStorage : sessionStorage;
  }
  return storage;
}

/**
 * Filter state based on include/exclude lists.
 * Functions are always excluded.
 */
function filterState<T extends object>(
  state: T,
  include?: (keyof T)[],
  exclude?: (keyof T)[],
): Partial<T> {
  let result: Partial<T> = {};

  if (include) {
    for (const k of include) {
      if (k in state && typeof state[k] !== 'function') {
        result[k] = state[k];
      }
    }
  } else {
    for (const key of Object.keys(state) as (keyof T)[]) {
      if (typeof state[key] !== 'function') {
        result[key] = state[key];
      }
    }
  }

  if (exclude) {
    for (const k of exclude) {
      delete result[k];
    }
  }

  return result;
}

/**
 * Persist middleware — automatically save and restore state.
 *
 * @example
 * ```ts
 * const userNucleus = createNucleus(
 *   (set) => ({ name: '', email: '', token: '' }),
 *   {
 *     middleware: [
 *       persist({
 *         key: 'user',
 *         include: ['name', 'email'],
 *         version: 2,
 *         migrate: (old, v) => {
 *           if (v === 1) return { ...old, email: '' };
 *           return old;
 *         },
 *       }),
 *     ],
 *   },
 * );
 * ```
 */
export function persist<T extends object>(
  options: PersistOptions<T>,
): Middleware<T> {
  const {
    key,
    storage = 'local',
    include,
    exclude,
    version = DEFAULT_VERSION,
    migrate,
  } = options;

  const storageKey = `${PERSIST_KEY_PREFIX}${key}`;
  let persistTimeout: ReturnType<typeof setTimeout> | null = null;

  return ({ initialState }) => (set, get, nucleus) => {
    const storageInstance = getStorage(storage);

    const hydrate = async () => {
      try {
        const raw = storageInstance.getItem(storageKey);
        const stored = raw instanceof Promise ? await raw : raw;
        if (!stored) return;

        const parsed = JSON.parse(stored as string);
        const storedVersion: number = parsed.version ?? 1;

        let hydratedState: Partial<T>;

        if (storedVersion !== version && migrate) {
          hydratedState = migrate(parsed.state, storedVersion) as Partial<T>;
        } else if (storedVersion !== version) {
          // Version mismatch with no migration — skip hydration to avoid
          // shape conflicts. Persisted data will be overwritten on next save.
          return;
        } else {
          hydratedState = parsed.state as Partial<T>;
        }

        // Only hydrate keys that exist in current state shape (defensive)
        const current = get();
        const safeState: Partial<T> = {};
        for (const k of Object.keys(hydratedState as object) as (keyof T)[]) {
          if (k in current) {
            safeState[k] = (hydratedState as T)[k];
          }
        }

        set(safeState);
      } catch (error) {
        console.warn('Synapse persist: Failed to hydrate', error);
      }
    };

    const save = (state: T) => {
      if (persistTimeout) clearTimeout(persistTimeout);

      persistTimeout = setTimeout(() => {
        try {
          const stateToPersist = filterState(state, include, exclude);

          const data = JSON.stringify({
            state: stateToPersist,
            version,
            timestamp: Date.now(),
          });

          const result = storageInstance.setItem(storageKey, data);
          // Handle async storage (fire & forget)
          if (result instanceof Promise) {
            result.catch((e) =>
              console.warn('Synapse persist: Async save failed', e),
            );
          }
        } catch (error) {
          console.warn('Synapse persist: Failed to save', error);
        }
      }, NUMBERS.PERSIST_THROTTLE);
    };

    hydrate();

    nucleus.subscribe((state) => {
      save(state);
    });

    return ((partial, replace) => {
      set(partial, replace);
    }) as SetState<T>;
  };
}

/**
 * Clear persisted state for a given key.
 */
export function clearPersisted(
  key: string,
  storage: 'local' | 'session' = 'local',
): void {
  const storageKey = `${PERSIST_KEY_PREFIX}${key}`;
  const storageInstance = getStorage(storage);
  storageInstance.removeItem(storageKey);
}
