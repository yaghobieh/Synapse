import type { Middleware, MiddlewareHooks, SetState } from '../types';

export function interceptor<T extends object>(hooks: MiddlewareHooks<T>): Middleware<T> {
  const { before, after } = hooks;

  return () => (set, get) => {
    return ((partial, replace) => {
      const prevState = get();
      const update = typeof partial === 'function' ? partial(prevState) : partial;

      let finalUpdate: Partial<T> = update;
      if (before) {
        const result = before(update, prevState);
        if (result === false) return;
        if (result) finalUpdate = result;
      }

      set(finalUpdate, replace);

      if (after) {
        after(get(), prevState);
      }
    }) as SetState<T>;
  };
}
