/**
 * Synapse - useDispatch Hook
 * Dispatch actions to the store
 */

import { useCallback, useMemo } from "react";
import type { Action, AnyAction, PayloadAction } from "@types/action.types";
import type { Dispatch, State } from "@types/store.types";
import type { BoundActionCreator } from "@types/hooks.types";
import { useSynapseContext } from "../context";

/**
 * useDispatch hook - get dispatch function
 */
export function useDispatch<A extends Action = AnyAction>(): Dispatch<A> {
  const { dispatch } = useSynapseContext<State, A>();
  return dispatch;
}

/**
 * Create a typed dispatch hook
 */
export function createDispatchHook<A extends Action = AnyAction>(): () => Dispatch<A> {
  return () => useDispatch<A>();
}

/**
 * Bind action creator to dispatch
 */
export function bindActionCreator<P, A extends PayloadAction<P> = PayloadAction<P>>(
  actionCreator: (payload: P) => A,
  dispatch: Dispatch<A>
): BoundActionCreator<P> {
  return (payload: P) => {
    dispatch(actionCreator(payload));
  };
}

/**
 * Bind multiple action creators to dispatch
 */
export function bindActionCreators<
  AC extends Record<string, (payload?: unknown) => AnyAction>
>(
  actionCreators: AC,
  dispatch: Dispatch<AnyAction>
): { [K in keyof AC]: (...args: Parameters<AC[K]>) => void } {
  const boundCreators: Record<string, (...args: unknown[]) => void> = {};

  for (const key of Object.keys(actionCreators)) {
    const actionCreator = actionCreators[key];
    boundCreators[key] = (...args: unknown[]) => {
      dispatch(actionCreator(...args));
    };
  }

  return boundCreators as { [K in keyof AC]: (...args: Parameters<AC[K]>) => void };
}

/**
 * useActions hook - bind action creators to dispatch
 */
export function useActions<
  AC extends Record<string, (payload?: unknown) => AnyAction>
>(actionCreators: AC): { [K in keyof AC]: (...args: Parameters<AC[K]>) => void } {
  const dispatch = useDispatch();
  
  return useMemo(
    () => bindActionCreators(actionCreators, dispatch),
    [actionCreators, dispatch]
  );
}

/**
 * useAction hook - bind single action creator
 */
export function useAction<P = void>(
  actionCreator: (payload: P) => AnyAction
): (payload: P) => void {
  const dispatch = useDispatch();
  
  return useCallback(
    (payload: P) => {
      dispatch(actionCreator(payload));
    },
    [actionCreator, dispatch]
  );
}

/**
 * useBatchDispatch hook - dispatch multiple actions at once
 */
export function useBatchDispatch(): (actions: AnyAction[]) => void {
  const dispatch = useDispatch();
  
  return useCallback(
    (actions: AnyAction[]) => {
      dispatch({
        type: "@@synapse/BATCH",
        payload: actions,
      });
    },
    [dispatch]
  );
}

