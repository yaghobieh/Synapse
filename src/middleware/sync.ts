import type { Middleware, SetState } from '../types';

export interface SyncOptions {
  key: string;
  include?: string[];
  exclude?: string[];
  debounce?: number;
}

export function sync<T extends object>(options: SyncOptions): Middleware<T> {
  const { key, include, exclude = [], debounce: debounceMs = 50 } = options;

  return () => {
    let channel: BroadcastChannel | null = null;
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
    let isReceiving = false;

    const shouldSync = (stateKey: string): boolean => {
      if (include) {
        return include.includes(stateKey);
      }
      return !exclude.includes(stateKey);
    };

    const filterState = (state: T): Partial<T> => {
      const filtered: Partial<T> = {};
      for (const k of Object.keys(state) as (keyof T)[]) {
        if (shouldSync(k as string) && typeof state[k] !== 'function') {
          filtered[k] = state[k];
        }
      }
      return filtered;
    };

    return (next: SetState<T>, get) => {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(`synapse:${key}`);
        
        channel.onmessage = (event) => {
          if (event.data?.type === 'SYNAPSE_SYNC' && event.data.state) {
            isReceiving = true;
            next(event.data.state as Partial<T>, false);
            setTimeout(() => { isReceiving = false; }, 10);
          }
        };
      }

      const broadcast = (state: Partial<T>) => {
        if (channel && !isReceiving) {
          channel.postMessage({
            type: 'SYNAPSE_SYNC',
            state,
            timestamp: Date.now(),
          });
        }
      };

      const enhancedSet: SetState<T> = (partial, replace) => {
        next(partial, replace);

        if (isReceiving) return;

        const currentState = get();
        const syncState = filterState(currentState);

        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
        }

        debounceTimeout = setTimeout(() => {
          broadcast(syncState);
          debounceTimeout = null;
        }, debounceMs);
      };

      return enhancedSet;
    };
  };
}

