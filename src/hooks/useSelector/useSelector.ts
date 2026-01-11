/**
 * Synapse - useSelector Hook
 * Select and subscribe to store state
 */

import { useCallback, useRef, useSyncExternalStore } from "react";
import type { Selector, EqualityFn, UseSelectorOptions } from "@types/hooks.types";
import type { State } from "@types/store.types";
import { useSynapseContext } from "../context";
import { shallowEqual } from "@utils/helpers";

/**
 * Default equality function
 */
const defaultEqualityFn: EqualityFn<unknown> = (a, b) => a === b;

/**
 * useSelector hook - select state from store
 */
export function useSelector<S = State, R = unknown>(
  selector: Selector<S, R>,
  options: UseSelectorOptions<R> = {}
): R {
  const { equalityFn = defaultEqualityFn } = options;
  const { getState, subscribe } = useSynapseContext<S>();
  
  // Keep track of the last selected value for comparison
  const lastSelectedRef = useRef<R | undefined>(undefined);
  const lastStateRef = useRef<S | undefined>(undefined);

  // Create snapshot getter
  const getSnapshot = useCallback((): R => {
    const state = getState();
    
    // If state hasn't changed, return cached value
    if (lastStateRef.current === state && lastSelectedRef.current !== undefined) {
      return lastSelectedRef.current;
    }

    const selected = selector(state);

    // Check if selected value has changed
    if (
      lastSelectedRef.current !== undefined &&
      equalityFn(lastSelectedRef.current, selected)
    ) {
      return lastSelectedRef.current;
    }

    lastSelectedRef.current = selected;
    lastStateRef.current = state;

    return selected;
  }, [getState, selector, equalityFn]);

  // Use React's useSyncExternalStore for subscription
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * useSelector with shallow equality
 */
export function useShallowSelector<S = State, R = unknown>(
  selector: Selector<S, R>
): R {
  return useSelector(selector, { equalityFn: shallowEqual as EqualityFn<R> });
}

/**
 * useSelector with custom equality function
 */
export function useSelectorWithEquality<S = State, R = unknown>(
  selector: Selector<S, R>,
  equalityFn: EqualityFn<R>
): R {
  return useSelector(selector, { equalityFn });
}

/**
 * Create a typed selector hook
 */
export function createSelectorHook<S = State>(): <R>(
  selector: Selector<S, R>,
  options?: UseSelectorOptions<R>
) => R {
  return <R>(selector: Selector<S, R>, options?: UseSelectorOptions<R>): R => {
    return useSelector<S, R>(selector, options);
  };
}

