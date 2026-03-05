/**
 * Synapse — Ultra-simple state management for React
 *
 * No dispatch. No reducers. No selectors. Just create a nucleus and use it.
 *
 * @example
 * ```tsx
 * import { createNucleus, useNucleus } from '@forgedevstack/synapse';
 *
 * const counterNucleus = createNucleus((set) => ({
 *   count: 0,
 *   increment: () => set((s) => ({ count: s.count + 1 })),
 *   decrement: () => set((s) => ({ count: s.count - 1 })),
 *   reset: () => set({ count: 0 }),
 * }));
 *
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
export { createNucleus, applyMiddleware, batchUpdates } from './core/nucleus';
export { signal, computed, batch, effect } from './core/signal';

// DevTools
export { initApiTracking, trackApiCall, getApiCalls, clearApiCalls } from './devtools/apiTracker';

// Hooks
export {
  useNucleus,
  usePick,
  useNucleusSlice,
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
