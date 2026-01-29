/**
 * Synapse - Ultra-simple state management for React
 * 
 * @description
 * Synapse is a modern state management library that makes React state simple.
 * No dispatch, no reducers, no selectors - just create a nucleus and use it!
 * 
 * @example
 * ```tsx
 * import { createNucleus, useNucleus } from '@forgedevstack/synapse';
 * 
 * // Create your state
 * const counterNucleus = createNucleus((set) => ({
 *   count: 0,
 *   increment: () => set((state) => ({ count: state.count + 1 })),
 *   decrement: () => set((state) => ({ count: state.count - 1 })),
 *   reset: () => set({ count: 0 }),
 * }));
 * 
 * // Use in components
 * function Counter() {
 *   const { count, increment, decrement, reset } = useNucleus(counterNucleus);
 *   
 *   return (
 *     <div>
 *       <span>{count}</span>
 *       <button onClick={increment}>+</button>
 *       <button onClick={decrement}>-</button>
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @packageDocumentation
 */

// Core
export { createNucleus, applyMiddleware } from './core/nucleus';
export { signal, computed, batch, effect } from './core/signal';

// DevTools
export { initApiTracking, trackApiCall, getApiCalls, clearApiCalls } from './devtools/apiTracker';

// Hooks
export {
  useNucleus,
  usePick,
  useNuclei,
  useAction,
  useSubscribe,
  useSnapshot,
} from './hooks/useNucleus';

export {
  useSignal,
  useComputed,
  useLocalSignal,
  useLocalComputed,
} from './hooks/useSignal';

export {
  useQuery,
  useMutation,
  useApi,
} from './hooks/useApi';

// Types
export type {
  Nucleus,
  SetState,
  Listener,
  Unsubscribe,
  StateInitializer,
  SynapseConfig,
  Signal,
  ComputedSignal,
  Selector,
  NamingConvention,
  PersistConfig,
  QueryState,
  MutationState,
  ApiConfig,
} from './types';

// Constants
export { VERSION } from './constants';

