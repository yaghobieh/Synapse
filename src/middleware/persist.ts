import type { Middleware, PersistOptions, SetState, StorageInput } from '../types';
import { PERSIST_DEFAULTS } from '../constants/persist.const';
import { attachPersistence } from '../persist/persistence';
import { resolveStorageAdapter } from '../persist/storage';

export function persist<T extends object>(
  options: PersistOptions<T>,
): Middleware<T> {
  return () => (set, get, nucleus) => {
    attachPersistence(nucleus, {
      key: options.key,
      storage: options.storage,
      namespace: options.namespace,
      include: options.include,
      exclude: options.exclude,
      version: options.version,
      migrate: options.migrate,
      debounceMs: options.debounceMs,
    });

    return ((partial, replace) => {
      set(partial, replace);
    }) as SetState<T>;
  };
}

export function clearPersisted(
  key: string,
  storage: StorageInput = PERSIST_DEFAULTS.STORAGE,
  namespace: string = PERSIST_DEFAULTS.NAMESPACE,
): void {
  const adapter = resolveStorageAdapter(storage);
  adapter.removeItem(`${namespace}${key}`);
}
