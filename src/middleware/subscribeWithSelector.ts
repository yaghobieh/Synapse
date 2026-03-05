/**
 * subscribeWithSelector middleware
 *
 * Wraps nucleus.subscribe so that external subscribers can filter by a
 * selector — they are only called when the selected slice actually changes.
 *
 * @example
 * ```ts
 * import { createNucleus } from '@forgedevstack/synapse';
 * import { subscribeWithSelector } from '@forgedevstack/synapse/middleware';
 *
 * const nucleus = createNucleus(
 *   (set) => ({ count: 0, name: 'John' }),
 *   { middleware: [subscribeWithSelector()] },
 * );
 *
 * // Only fires when `count` actually changes
 * nucleus.subscribe((state, prev) => {
 *   console.log('count changed', state.count);
 * });
 * ```
 *
 * Note: The middleware itself doesn't alter `set` behaviour — it enhances the
 * nucleus with a `subscribeWithSelector` helper exposed through the state
 * returned by `nucleus.get()`.
 */

import type { Middleware, SetState, Selector, Unsubscribe } from '../types';
import { shallowEqual } from '../utils/object';

export interface SubscribeWithSelectorApi<T> {
  /**
   * Subscribe to a slice of state. The listener is only called when the
   * selected value changes (per the provided equality function, which
   * defaults to shallow equality).
   */
  subscribeWithSelector: <R>(
    selector: Selector<T, R>,
    listener: (selected: R, previousSelected: R) => void,
    equalityFn?: (a: R, b: R) => boolean,
  ) => Unsubscribe;
}

export function subscribeWithSelector<
  T extends object,
>(): Middleware<T & SubscribeWithSelectorApi<T>> {
  return () => (set, get, nucleus) => {
    const subWithSel: SubscribeWithSelectorApi<T>['subscribeWithSelector'] = <R>(
      selector: Selector<T, R>,
      listener: (selected: R, previousSelected: R) => void,
      equalityFn: (a: R, b: R) => boolean = shallowEqual,
    ): Unsubscribe => {
      let currentSelected = selector(get() as T);

      return nucleus.subscribe((state) => {
        const nextSelected = selector(state as T);
        if (!equalityFn(currentSelected, nextSelected)) {
          const prev = currentSelected;
          currentSelected = nextSelected;
          listener(nextSelected, prev);
        }
      });
    };

    setTimeout(() => {
      set({
        subscribeWithSelector: subWithSel,
      } as Partial<T & SubscribeWithSelectorApi<T>>, false);
    }, 0);

    return ((partial, replace) => {
      set(partial, replace);
    }) as SetState<T & SubscribeWithSelectorApi<T>>;
  };
}
