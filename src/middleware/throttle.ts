import type { Middleware, SetState } from '../types';

export interface ThrottleOptions {
  wait?: number;
  leading?: boolean;
  trailing?: boolean;
  keys?: string[];
}

export function throttle<T extends object>(options: ThrottleOptions = {}): Middleware<T> {
  const { wait = 16, leading = true, trailing = true, keys } = options;

  return () => {
    let lastCallTime = 0;
    let pendingUpdate: Partial<T> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (next: SetState<T>, get) => {
      const enhancedSet: SetState<T> = (partial, replace) => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;

        const update = typeof partial === 'function' ? partial(get()) : partial;

        if (keys) {
          const updateKeys = Object.keys(update as object);
          const shouldThrottle = updateKeys.some(k => keys.includes(k));
          
          if (!shouldThrottle) {
            next(partial, replace);
            return;
          }
        }

        const executeUpdate = () => {
          lastCallTime = Date.now();
          if (pendingUpdate) {
            next(pendingUpdate as Partial<T>, replace);
            pendingUpdate = null;
          } else {
            next(partial, replace);
          }
        };

        if (timeSinceLastCall >= wait) {
          if (leading) {
            executeUpdate();
          } else {
            pendingUpdate = update as Partial<T>;
            if (!timeoutId) {
              timeoutId = setTimeout(() => {
                executeUpdate();
                timeoutId = null;
              }, wait);
            }
          }
        } else {
          pendingUpdate = update as Partial<T>;
          
          if (trailing && !timeoutId) {
            timeoutId = setTimeout(() => {
              executeUpdate();
              timeoutId = null;
            }, wait - timeSinceLastCall);
          }
        }
      };

      return enhancedSet;
    };
  };
}

export interface DebounceOptions {
  wait?: number;
  keys?: string[];
}

export function debounce<T extends object>(options: DebounceOptions = {}): Middleware<T> {
  const { wait = 300, keys } = options;

  return () => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (next: SetState<T>, get) => {
      const enhancedSet: SetState<T> = (partial, replace) => {
        const update = typeof partial === 'function' ? partial(get()) : partial;

        if (keys) {
          const updateKeys = Object.keys(update as object);
          const shouldDebounce = updateKeys.some(k => keys.includes(k));
          
          if (!shouldDebounce) {
            next(partial, replace);
            return;
          }
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          next(partial, replace);
          timeoutId = null;
        }, wait);
      };

      return enhancedSet;
    };
  };
}

