/**
 * useNucleus - React hooks for accessing Nucleus state
 *
 * The main hooks for using Synapse in React components.
 * No "dispatch" or "selector" — just use the state directly.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Nucleus, Selector } from '../types';
import { shallowEqual } from '../utils/object';

/**
 * Use entire nucleus state in a React component.
 *
 * Optionally pass a selector to subscribe to a slice — the component only
 * re-renders when the selected value changes (shallow comparison).
 *
 * @example
 * ```tsx
 * // Full state
 * const { name, email } = useNucleus(userNucleus);
 *
 * // With selector (optimised re-renders)
 * const name = useNucleus(userNucleus, s => s.name);
 * ```
 */
export function useNucleus<T extends object>(nucleus: Nucleus<T>): T;
export function useNucleus<T extends object, R>(
  nucleus: Nucleus<T>,
  selector: Selector<T, R>,
): R;
export function useNucleus<T extends object, R>(
  nucleus: Nucleus<T>,
  selector?: Selector<T, R>,
): T | R {
  if (selector) {
    return usePick(nucleus, selector);
  }

  const [state, setState] = useState<T>(() => nucleus.get());

  useEffect(() => {
    const unsubscribe = nucleus.subscribe((newState) => {
      setState(newState);
    });
    setState(nucleus.get());
    return unsubscribe;
  }, [nucleus]);

  return state;
}

/**
 * Use a selected slice of nucleus state.
 * Only re-renders when the selected value changes.
 *
 * @param equalityFn  Custom equality check — defaults to {@link shallowEqual}
 *                    so object/array slices don't cause spurious re-renders.
 *
 * @example
 * ```tsx
 * const name = usePick(userNucleus, s => s.name);
 * const ids  = usePick(userNucleus, s => s.todos.map(t => t.id));
 * ```
 */
export function usePick<T extends object, R>(
  nucleus: Nucleus<T>,
  selector: Selector<T, R>,
  equalityFn: (a: R, b: R) => boolean = shallowEqual,
): R {
  const [selectedState, setSelectedState] = useState<R>(() =>
    selector(nucleus.get()),
  );

  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);

  selectorRef.current = selector;
  equalityFnRef.current = equalityFn;

  useEffect(() => {
    const unsubscribe = nucleus.subscribe((state) => {
      const newSelected = selectorRef.current(state);
      setSelectedState((prev) => {
        if (equalityFnRef.current(prev, newSelected)) {
          return prev;
        }
        return newSelected;
      });
    });
    setSelectedState(selector(nucleus.get()));
    return unsubscribe;
  }, [nucleus]);

  return selectedState;
}

/**
 * Pick multiple keys from a nucleus in a single subscription.
 *
 * Returns a stable object containing only the requested keys. Re-renders only
 * when one of those keys changes (shallow comparison per key).
 *
 * @example
 * ```tsx
 * const { count, increment } = useNucleusSlice(counterNucleus, ['count', 'increment']);
 * ```
 */
export function useNucleusSlice<T extends object, K extends keyof T>(
  nucleus: Nucleus<T>,
  keys: K[],
): Pick<T, K> {
  const pick = useCallback(
    (state: T): Pick<T, K> => {
      const result = {} as Pick<T, K>;
      for (const k of keys) {
        result[k] = state[k];
      }
      return result;
    },
    // keys list is treated as stable identity — same pattern as dependency arrays
    // eslint-disable-next-line react-hooks/exhaustive-deps
    keys,
  );

  const [slice, setSlice] = useState<Pick<T, K>>(() => pick(nucleus.get()));
  const pickRef = useRef(pick);
  pickRef.current = pick;

  useEffect(() => {
    const unsubscribe = nucleus.subscribe((state) => {
      const next = pickRef.current(state);
      setSlice((prev) => {
        for (const k of keys) {
          if (!Object.is(prev[k], next[k])) return next;
        }
        return prev;
      });
    });
    setSlice(pick(nucleus.get()));
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nucleus, ...keys]);

  return slice;
}

/**
 * Use multiple nucleus states together.
 *
 * @example
 * ```tsx
 * const [user, products] = useNuclei([userNucleus, productsNucleus]);
 * ```
 */
export function useNuclei<T extends Nucleus<object>[]>(
  nuclei: [...T],
): { [K in keyof T]: T[K] extends Nucleus<infer S> ? S : never } {
  const [states, setStates] = useState(() => nuclei.map((n) => n.get()));

  useEffect(() => {
    const unsubscribes = nuclei.map((nucleus, index) =>
      nucleus.subscribe((newState) => {
        setStates((prev) => {
          const next = [...prev];
          next[index] = newState;
          return next;
        });
      }),
    );
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [nuclei]);

  return states as { [K in keyof T]: T[K] extends Nucleus<infer S> ? S : never };
}

/**
 * Create a stable action reference that never changes identity.
 *
 * @example
 * ```tsx
 * const increment = useAction(() =>
 *   counterNucleus.set(s => ({ count: s.count + 1 }))
 * );
 * ```
 */
export function useAction<T extends (...args: unknown[]) => unknown>(action: T): T {
  const actionRef = useRef(action);
  actionRef.current = action;

  return useCallback((...args: Parameters<T>) => {
    return actionRef.current(...args);
  }, []) as T;
}

/**
 * Subscribe to nucleus changes with a callback (side-effect only, no re-render).
 *
 * @example
 * ```tsx
 * useSubscribe(userNucleus, (state, prev) => {
 *   if (state.name !== prev.name) analytics.track('name_changed');
 * });
 * ```
 */
export function useSubscribe<T extends object>(
  nucleus: Nucleus<T>,
  callback: (state: T, prevState: T) => void,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return nucleus.subscribe((state, prev) => {
      callbackRef.current(state, prev);
    });
  }, [nucleus]);
}

/**
 * Get a stable getter for nucleus state without subscribing (no re-renders).
 *
 * @example
 * ```tsx
 * const getState = useSnapshot(formNucleus);
 * const handleSave = () => api.save(getState());
 * ```
 */
export function useSnapshot<T extends object>(nucleus: Nucleus<T>): () => T {
  return useCallback(() => nucleus.get(), [nucleus]);
}
