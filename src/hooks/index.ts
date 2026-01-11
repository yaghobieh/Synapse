/**
 * Synapse - Hooks Index
 * Exports all React hooks
 */

// Context and Provider
export {
  SynapseProvider,
  useSynapseContext,
  useStore,
  createSynapseContext,
} from "./context";
export type { SynapseProviderProps } from "./context";

// useSelector
export {
  useSelector,
  useShallowSelector,
  useSelectorWithEquality,
  createSelectorHook,
} from "./useSelector";

// useDispatch
export {
  useDispatch,
  createDispatchHook,
  bindActionCreator,
  bindActionCreators,
  useActions,
  useAction,
  useBatchDispatch,
} from "./useDispatch";

// useQuery
export {
  useQuery,
  useMutation,
  useLazyQuery,
} from "./useQuery";

// Saga functionality removed as requested

// useAction
export {
  useActionStatus,
  useAsyncAction,
  useOptimisticAction,
  useActionCreators,
} from "./useAction";

