import type {
  Nucleus,
  SetState,
  Listener,
  Unsubscribe,
  StateInitializer,
  SynapseConfig,
  Middleware,
  PersistConfig,
  PersistHandle,
} from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { NUCLEUS_ERRORS, NUCLEUS_DEFAULTS } from '../constants/nucleus.const';
import { deepClone, shallowMerge } from '../utils/object';
import { scheduleNotification } from '../utils/batch';
import { connectDevTools, setCurrentAction } from '../devtools/connector';
import { attachPersistence } from '../persist/persistence';

export { batchUpdates } from '../utils/batch';

function resolvePersistConfig(
  persist: PersistConfig | boolean | undefined,
  fallbackKey: string,
): PersistConfig | null {
  if (!persist) return null;
  if (persist === true) return { key: fallbackKey };
  return persist;
}

export function createNucleus<T extends object>(
  initializer: StateInitializer<T>,
  config: SynapseConfig<T> = {},
): Nucleus<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  let state: T;
  let listeners: Set<Listener<T>> = new Set();
  let isDestroyed = false;
  let initialState: T;
  let middlewareChain: SetState<T> | null = null;
  let persistHandle: PersistHandle | null = null;

  const get = (): T => {
    if (isDestroyed) {
      throw new Error(NUCLEUS_ERRORS.DESTROYED_GET);
    }
    return state;
  };

  const set: SetState<T> = (partial, replace = false) => {
    if (isDestroyed) {
      throw new Error(NUCLEUS_ERRORS.DESTROYED_SET);
    }

    const prevState = state;
    const nextPartial = typeof partial === 'function'
      ? partial(state)
      : partial;

    if (replace) {
      state = nextPartial as T;
    } else {
      state = shallowMerge(state, nextPartial);
    }

    if (state !== prevState) {
      const currentState = state;

      scheduleNotification(() => {
        listeners.forEach((listener) => {
          try {
            listener(currentState, prevState);
          } catch (error) {
            console.error('Synapse: Error in listener', error);
          }
        });
      });

      if (finalConfig.logging) {
        console.log('Synapse: State updated', {
          prev: prevState,
          next: state,
          changes: nextPartial,
        });
      }
    }
  };

  const setThroughMiddleware: SetState<T> = (partial, replace) => {
    if (middlewareChain) {
      middlewareChain(partial, replace);
      return;
    }
    set(partial, replace);
  };

  const subscribe = (listener: Listener<T>): Unsubscribe => {
    if (isDestroyed) {
      throw new Error(NUCLEUS_ERRORS.DESTROYED_SUBSCRIBE);
    }

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const pick = <K extends keyof T>(key: K): T[K] => {
    return get()[key];
  };

  const reset = (): void => {
    set(deepClone(initialState) as Partial<T>, true);
  };

  const destroy = (): void => {
    if (isDestroyed) return;
    isDestroyed = true;
    if (persistHandle) {
      persistHandle.stop();
      persistHandle = null;
    }
    listeners.clear();
  };

  const nucleus: Nucleus<T> = {
    get,
    set: setThroughMiddleware,
    subscribe,
    pick,
    reset,
    destroy,
  };

  state = initializer(setThroughMiddleware, get, nucleus);

  if (finalConfig.devtools) {
    const wrappedState = { ...state };

    for (const key in state) {
      const value = state[key];
      if (typeof value === 'function') {
        (wrappedState as Record<string, unknown>)[key] = (...args: unknown[]) => {
          setCurrentAction(key);
          return (value as (...args: unknown[]) => unknown)(...args);
        };
      }
    }

    state = wrappedState;
  }

  initialState = deepClone(state);

  if (finalConfig.middleware && finalConfig.middleware.length > 0) {
    middlewareChain = finalConfig.middleware.reduceRight(
      (acc, middleware) =>
        middleware({ nucleus, initialState, config: finalConfig })(acc, get, nucleus),
      set,
    );
  }

  if (finalConfig.devtools) {
    connectDevTools(nucleus, finalConfig.devtoolsName || NUCLEUS_DEFAULTS.DEVTOOLS_NAME);
  }

  const persistConfig = resolvePersistConfig(
    finalConfig.persist,
    finalConfig.devtoolsName || NUCLEUS_DEFAULTS.DEVTOOLS_NAME,
  );

  if (persistConfig) {
    persistHandle = attachPersistence(nucleus, {
      key: persistConfig.key,
      storage: persistConfig.storage,
      namespace: persistConfig.namespace,
      include: persistConfig.include as (keyof T)[] | undefined,
      exclude: persistConfig.exclude as (keyof T)[] | undefined,
      version: persistConfig.version,
      migrate: persistConfig.migrate,
      debounceMs: persistConfig.debounceMs,
      serialize: persistConfig.serialize,
      deserialize: persistConfig.deserialize,
    });
  }

  return nucleus;
}

export function applyMiddleware<T extends object>(
  ...middlewares: Middleware<T>[]
): (initializer: StateInitializer<T>, config?: SynapseConfig<T>) => Nucleus<T> {
  return (initializer, config = {}) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    let nucleus: Nucleus<T>;

    const enhancedSet = middlewares.reduceRight(
      (acc, middleware) => {
        return middleware({
          nucleus: nucleus!,
          initialState: {} as T,
          config: finalConfig,
        })(acc, () => nucleus!.get(), nucleus!);
      },
      ((partial, replace) => nucleus!.set(partial, replace)) as SetState<T>,
    );

    nucleus = createNucleus((set, get, nuc) => {
      const enhancedInitializer = initializer(
        enhancedSet,
        get,
        nuc,
      );
      return enhancedInitializer;
    }, config);

    return nucleus;
  };
}
