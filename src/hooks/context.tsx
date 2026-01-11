/**
 * Synapse - React Context
 * Store context and provider
 */

import React, { createContext, useContext, useRef, useMemo, useCallback, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { Action, AnyAction } from "@types/action.types";
import type { Store, State } from "@types/store.types";
import type { StoreContextValue } from "@types/hooks.types";

/**
 * Store context
 */
const SynapseContext = createContext<StoreContextValue | null>(null);

/**
 * Subscription context for batched updates
 */
interface Subscription {
  onStateChange?: () => void;
}

const SubscriptionContext = createContext<Subscription | null>(null);

/**
 * Provider props
 */
export interface SynapseProviderProps<S = State, A extends Action = AnyAction> {
  store: Store<S, A>;
  children: ReactNode;
}

/**
 * Synapse Provider component
 */
export function SynapseProvider<S = State, A extends Action = AnyAction>({
  store,
  children,
}: SynapseProviderProps<S, A>): React.ReactElement {
  const subscription = useRef<Subscription>({});

  const contextValue = useMemo<StoreContextValue<S, A>>(
    () => ({
      getState: store.getState,
      dispatch: store.dispatch,
      subscribe: (listener) => {
        const unsubscribe = store.subscribe(() => {
          listener();
          subscription.current.onStateChange?.();
        });
        return unsubscribe;
      },
    }),
    [store]
  );

  return (
    <SubscriptionContext.Provider value={subscription.current}>
      <SynapseContext.Provider value={contextValue as StoreContextValue}>
        {children}
      </SynapseContext.Provider>
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook to access store context
 */
export function useSynapseContext<S = State, A extends Action = AnyAction>(): StoreContextValue<S, A> {
  const context = useContext(SynapseContext);
  
  if (!context) {
    throw new Error(
      "[Synapse] Could not find store context. " +
      "Make sure your component is wrapped in a <SynapseProvider>."
    );
  }
  
  return context as StoreContextValue<S, A>;
}

/**
 * Hook to access the store directly
 */
export function useStore<S = State, A extends Action = AnyAction>(): StoreContextValue<S, A> {
  return useSynapseContext<S, A>();
}

/**
 * Create a custom context for multiple stores
 */
export function createSynapseContext<S = State, A extends Action = AnyAction>(): {
  Provider: React.FC<SynapseProviderProps<S, A>>;
  useStore: () => StoreContextValue<S, A>;
  useSelector: <R>(selector: (state: S) => R) => R;
  useDispatch: () => (action: A) => A;
} {
  const CustomContext = createContext<StoreContextValue<S, A> | null>(null);

  function Provider({ store, children }: SynapseProviderProps<S, A>): React.ReactElement {
    const contextValue = useMemo<StoreContextValue<S, A>>(
      () => ({
        getState: store.getState,
        dispatch: store.dispatch,
        subscribe: store.subscribe,
      }),
      [store]
    );

    return (
      <CustomContext.Provider value={contextValue}>
        {children}
      </CustomContext.Provider>
    );
  }

  function useCustomStore(): StoreContextValue<S, A> {
    const context = useContext(CustomContext);
    if (!context) {
      throw new Error(
        "[Synapse] Could not find custom store context. " +
        "Make sure your component is wrapped in the custom Provider."
      );
    }
    return context;
  }

  function useCustomSelector<R>(selector: (state: S) => R): R {
    const { getState, subscribe } = useCustomStore();
    
    const getSnapshot = useCallback(() => selector(getState()), [getState, selector]);
    
    return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  function useCustomDispatch(): (action: A) => A {
    const { dispatch } = useCustomStore();
    return dispatch;
  }

  return {
    Provider,
    useStore: useCustomStore,
    useSelector: useCustomSelector,
    useDispatch: useCustomDispatch,
  };
}

