/**
 * useSignal - React hooks for signals
 */

import { useState, useEffect, useMemo } from 'react';
import type { Signal, ComputedSignal } from '../types';
import { signal as createSignal, computed as createComputed } from '../core/signal';

/**
 * Use a signal's value in a React component
 * 
 * @example
 * ```tsx
 * const countSignal = signal(0);
 * 
 * function Counter() {
 *   const count = useSignal(countSignal);
 *   return <span>{count}</span>;
 * }
 * ```
 */
export function useSignal<T>(signalRef: Signal<T>): T {
  const [value, setValue] = useState<T>(() => signalRef.value);
  
  useEffect(() => {
    const unsubscribe = signalRef.subscribe((newValue) => {
      setValue(newValue);
    });
    
    // Sync with current value
    setValue(signalRef.value);
    
    return unsubscribe;
  }, [signalRef]);
  
  return value;
}

/**
 * Use a computed signal's value
 * 
 * @example
 * ```tsx
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 * const fullName = computed(() => `${firstName.value} ${lastName.value}`);
 * 
 * function Name() {
 *   const name = useComputed(fullName);
 *   return <h1>{name}</h1>;
 * }
 * ```
 */
export function useComputed<T>(computedSignal: ComputedSignal<T>): T {
  const [value, setValue] = useState<T>(() => computedSignal.value);
  
  useEffect(() => {
    const unsubscribe = computedSignal.subscribe((newValue) => {
      setValue(newValue);
    });
    
    // Sync with current value
    setValue(computedSignal.value);
    
    return unsubscribe;
  }, [computedSignal]);
  
  return value;
}

/**
 * Create a local signal for component state
 * (Like useState but with signal semantics)
 * 
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useLocalSignal(0);
 *   return (
 *     <button onClick={() => setCount(c => c + 1)}>
 *       {count}
 *     </button>
 *   );
 * }
 * ```
 */
export function useLocalSignal<T>(
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const signalRef = useMemo(() => createSignal(initialValue), []);
  const value = useSignal(signalRef);
  
  return [value, signalRef.set];
}

/**
 * Create a local computed value
 * 
 * @example
 * ```tsx
 * function Calculator({ a, b }) {
 *   const sum = useLocalComputed(() => a + b, [a, b]);
 *   return <span>{sum}</span>;
 * }
 * ```
 */
export function useLocalComputed<T>(
  compute: () => T,
  deps: unknown[]
): T {
  const computedRef = useMemo(() => createComputed(compute), deps);
  return useComputed(computedRef);
}

