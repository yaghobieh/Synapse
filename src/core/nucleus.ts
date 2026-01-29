import type {
  Nucleus,
  SetState,
  Listener,
  Unsubscribe,
  StateInitializer,
  SynapseConfig,
  Middleware,
} from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { NUCLEUS_ERRORS, NUCLEUS_DEFAULTS } from '../constants/nucleus.const';
import { deepClone, shallowMerge } from '../utils/object';
import { connectDevTools, setCurrentAction } from '../devtools/connector';

export function createNucleus<T extends object>(
  initializer: StateInitializer<T>,
  config: SynapseConfig = {},
): Nucleus<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  let state: T;
  let listeners: Set<Listener<T>> = new Set();
  let isDestroyed = false;
  let initialState: T;

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
      listeners.forEach(listener => {
        try {
          listener(state, prevState);
        } catch (error) {
          console.error('Synapse: Error in listener', error);
        }
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
    listeners.clear();
  };

  const nucleus: Nucleus<T> = {
    get,
    set,
    subscribe,
    pick,
    reset,
    destroy,
  };

  state = initializer(set, get, nucleus);

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

  if (finalConfig.devtools) {
    connectDevTools(nucleus, finalConfig.devtoolsName || NUCLEUS_DEFAULTS.DEVTOOLS_NAME);
  }

  return nucleus;
}

export function applyMiddleware<T extends object>(
  ...middlewares: Middleware<T>[]
): (initializer: StateInitializer<T>, config?: SynapseConfig) => Nucleus<T> {
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
