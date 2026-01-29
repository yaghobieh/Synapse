/**
 * Persist Middleware - Save state to storage
 */

import type { Middleware, PersistOptions, SetState, Storage } from '../types';
import { PERSIST_KEY_PREFIX, NUMBERS } from '../constants';

/**
 * Get storage instance
 */
function getStorage(storage: 'local' | 'session' | Storage = 'local'): Storage {
  if (typeof storage === 'string') {
    if (typeof window === 'undefined') {
      // SSR fallback
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
 * Persist middleware - automatically save and restore state
 * 
 * @example
 * ```ts
 * const userNucleus = createNucleus(
 *   (set) => ({
 *     name: '',
 *     email: '',
 *     token: '',
 *   }),
 *   {
 *     middleware: [
 *       persist({
 *         key: 'user',
 *         include: ['name', 'email'], // Only persist these
 *         exclude: ['token'],          // Don't persist token
 *       }),
 *     ],
 *   }
 * );
 * ```
 */
export function persist<T extends object>(
  options: PersistOptions<T>
): Middleware<T> {
  const {
    key,
    storage = 'local',
    include,
    exclude,
    version = 1,
    migrate,
  } = options;
  
  const storageKey = `${PERSIST_KEY_PREFIX}${key}`;
  let persistTimeout: ReturnType<typeof setTimeout> | null = null;
  
  return ({ initialState }) => (set, get, nucleus) => {
    const storageInstance = getStorage(storage);
    
    // Try to hydrate from storage
    const hydrate = () => {
      try {
        const stored = storageInstance.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored as string);
          
          // Check version and migrate if needed
          if (parsed.version !== version && migrate) {
            const migrated = migrate(parsed.state, parsed.version);
            set(migrated as Partial<T>, true);
          } else {
            set(parsed.state as Partial<T>);
          }
        }
      } catch (error) {
        console.warn('Synapse persist: Failed to hydrate', error);
      }
    };
    
    // Save to storage (throttled)
    const save = (state: T) => {
      if (persistTimeout) {
        clearTimeout(persistTimeout);
      }
      
      persistTimeout = setTimeout(() => {
        try {
          // Filter state if include/exclude specified
          let stateToPersist: Partial<T> = state;
          
          if (include) {
            stateToPersist = {};
            for (const k of include) {
              if (k in state) {
                (stateToPersist as Record<string, unknown>)[k as string] = state[k];
              }
            }
          }
          
          if (exclude) {
            stateToPersist = { ...stateToPersist };
            for (const k of exclude) {
              delete (stateToPersist as Record<string, unknown>)[k as string];
            }
          }
          
          const data = JSON.stringify({
            state: stateToPersist,
            version,
            timestamp: Date.now(),
          });
          
          storageInstance.setItem(storageKey, data);
        } catch (error) {
          console.warn('Synapse persist: Failed to save', error);
        }
      }, NUMBERS.PERSIST_THROTTLE);
    };
    
    // Hydrate on init
    hydrate();
    
    // Subscribe to save on changes
    nucleus.subscribe((state) => {
      save(state);
    });
    
    // Return enhanced set
    return ((partial, replace) => {
      set(partial, replace);
    }) as SetState<T>;
  };
}

/**
 * Clear persisted state
 */
export function clearPersisted(key: string, storage: 'local' | 'session' = 'local'): void {
  const storageKey = `${PERSIST_KEY_PREFIX}${key}`;
  const storageInstance = getStorage(storage);
  storageInstance.removeItem(storageKey);
}

