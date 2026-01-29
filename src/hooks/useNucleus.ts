/**
 * useNucleus - React hook for accessing Nucleus state
 * 
 * This is the main hook for using Synapse in React components.
 * No "dispatch" or "selector" - just use the state directly!
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Nucleus, Selector } from '../types';

/**
 * Use entire nucleus state in a React component
 * 
 * @example
 * ```tsx
 * const userNucleus = createNucleus((set) => ({
 *   name: 'John',
 *   email: 'john@example.com',
 *   updateName: (name: string) => set({ name }),
 * }));
 * 
 * function UserProfile() {
 *   const { name, email, updateName } = useNucleus(userNucleus);
 *   
 *   return (
 *     <div>
 *       <h1>{name}</h1>
 *       <p>{email}</p>
 *       <button onClick={() => updateName('Jane')}>Change Name</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNucleus<T extends object>(nucleus: Nucleus<T>): T {
  const [state, setState] = useState<T>(() => nucleus.get());
  
  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = nucleus.subscribe((newState) => {
      setState(newState);
    });
    
    // Sync with current state (in case it changed before subscription)
    setState(nucleus.get());
    
    return unsubscribe;
  }, [nucleus]);
  
  return state;
}

/**
 * Use a selected slice of nucleus state
 * Only re-renders when the selected value changes
 * 
 * @example
 * ```tsx
 * function UserName() {
 *   const name = usePick(userNucleus, state => state.name);
 *   return <h1>{name}</h1>;
 * }
 * ```
 */
export function usePick<T extends object, R>(
  nucleus: Nucleus<T>,
  selector: Selector<T, R>,
  equalityFn: (a: R, b: R) => boolean = Object.is
): R {
  const [selectedState, setSelectedState] = useState<R>(() => 
    selector(nucleus.get())
  );
  
  const selectorRef = useRef(selector);
  const equalityFnRef = useRef(equalityFn);
  
  // Update refs
  selectorRef.current = selector;
  equalityFnRef.current = equalityFn;
  
  useEffect(() => {
    const unsubscribe = nucleus.subscribe((state) => {
      const newSelected = selectorRef.current(state);
      
      setSelectedState(prev => {
        if (equalityFnRef.current(prev, newSelected)) {
          return prev;
        }
        return newSelected;
      });
    });
    
    // Sync initial state
    setSelectedState(selector(nucleus.get()));
    
    return unsubscribe;
  }, [nucleus]);
  
  return selectedState;
}

/**
 * Use multiple nucleus states together
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const [user, products] = useNuclei([userNucleus, productsNucleus]);
 *   return <div>{user.name} has {products.items.length} products</div>;
 * }
 * ```
 */
export function useNuclei<T extends Nucleus<object>[]>(
  nuclei: [...T]
): { [K in keyof T]: T[K] extends Nucleus<infer S> ? S : never } {
  const [states, setStates] = useState(() => 
    nuclei.map(n => n.get())
  );
  
  useEffect(() => {
    const unsubscribes = nuclei.map((nucleus, index) =>
      nucleus.subscribe((newState) => {
        setStates(prev => {
          const next = [...prev];
          next[index] = newState;
          return next;
        });
      })
    );
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [nuclei]);
  
  return states as { [K in keyof T]: T[K] extends Nucleus<infer S> ? S : never };
}

/**
 * Create a stable action that works with nucleus
 * Prevents unnecessary re-renders from action references
 * 
 * @example
 * ```tsx
 * function Counter() {
 *   const count = usePick(counterNucleus, s => s.count);
 *   const increment = useAction(() => 
 *     counterNucleus.set(s => ({ count: s.count + 1 }))
 *   );
 *   
 *   return <button onClick={increment}>{count}</button>;
 * }
 * ```
 */
export function useAction<T extends (...args: unknown[]) => unknown>(
  action: T
): T {
  const actionRef = useRef(action);
  actionRef.current = action;
  
  return useCallback((...args: Parameters<T>) => {
    return actionRef.current(...args);
  }, []) as T;
}

/**
 * Subscribe to nucleus changes with a callback
 * Useful for side effects
 * 
 * @example
 * ```tsx
 * function UserTracker() {
 *   useSubscribe(userNucleus, (state, prev) => {
 *     if (state.name !== prev.name) {
 *       analytics.track('name_changed', { name: state.name });
 *     }
 *   });
 *   
 *   return null;
 * }
 * ```
 */
export function useSubscribe<T extends object>(
  nucleus: Nucleus<T>,
  callback: (state: T, prevState: T) => void
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
 * Get nucleus state without subscribing (no re-renders)
 * 
 * @example
 * ```tsx
 * function SaveButton() {
 *   const getState = useSnapshot(formNucleus);
 *   
 *   const handleSave = () => {
 *     const form = getState();
 *     api.save(form);
 *   };
 *   
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */
export function useSnapshot<T extends object>(nucleus: Nucleus<T>): () => T {
  return useCallback(() => nucleus.get(), [nucleus]);
}

