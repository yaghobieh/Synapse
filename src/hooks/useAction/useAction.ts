/**
 * Synapse - useAction Hook
 * Track action status and bind action creators
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { AnyAction } from "@types/action.types";
import type { ActionStatus, UseActionStatusResult } from "@types/hooks.types";
import { useDispatch } from "../useDispatch";
import { useSynapseContext } from "../context";

/**
 * Initial action status
 */
const initialStatus: ActionStatus = {
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null,
  timestamp: null,
};

/**
 * useActionStatus hook - track the status of an action
 */
export function useActionStatus(actionType: string): UseActionStatusResult {
  const [status, setStatus] = useState<ActionStatus>(initialStatus);
  const { subscribe } = useSynapseContext();

  const reset = useCallback(() => {
    setStatus(initialStatus);
  }, []);

  useEffect(() => {
    // Subscribe to track action status
    const unsubscribe = subscribe(() => {
      // Status updates would come from middleware
    });

    return () => unsubscribe();
  }, [subscribe, actionType]);

  return { ...status, reset };
}

/**
 * useAsyncAction hook - execute async action with status tracking
 */
export function useAsyncAction<P = void, R = void>(
  actionCreator: (payload: P) => (dispatch: (action: AnyAction) => AnyAction, getState: () => unknown) => Promise<R>
): {
  execute: (payload: P) => Promise<R>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: R | null;
  reset: () => void;
} {
  const dispatch = useDispatch();
  const [state, setState] = useState<{
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
    data: R | null;
  }>({
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (payload: P): Promise<R> => {
    setState(prev => ({
      ...prev,
      isPending: true,
      isSuccess: false,
      isError: false,
      error: null,
    }));

    try {
      const thunk = actionCreator(payload);
      const result = await (dispatch as unknown as (
        action: (dispatch: (action: AnyAction) => AnyAction, getState: () => unknown) => Promise<R>
      ) => Promise<R>)(thunk);

      if (mountedRef.current) {
        setState({
          isPending: false,
          isSuccess: true,
          isError: false,
          error: null,
          data: result,
        });
      }

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (mountedRef.current) {
        setState({
          isPending: false,
          isSuccess: false,
          isError: true,
          error: err,
          data: null,
        });
      }

      throw err;
    }
  }, [dispatch, actionCreator]);

  const reset = useCallback(() => {
    setState({
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    });
  }, []);

  return { execute, ...state, reset };
}

/**
 * useOptimisticAction hook - optimistic updates with rollback
 */
export function useOptimisticAction<P = void>(
  actionCreator: (payload: P) => AnyAction,
  options: {
    onOptimistic?: (payload: P) => void;
    onSuccess?: (payload: P) => void;
    onError?: (error: Error, payload: P) => void;
    onRollback?: (payload: P) => void;
  } = {}
): {
  execute: (payload: P) => void;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
} {
  const dispatch = useDispatch();
  const { onOptimistic, onSuccess, onError, onRollback } = options;

  const [state, setState] = useState({
    isPending: false,
    isError: false,
    error: null as Error | null,
  });

  const execute = useCallback((payload: P) => {
    // Apply optimistic update
    if (onOptimistic) {
      onOptimistic(payload);
    }

    setState({ isPending: true, isError: false, error: null });

    try {
      const action = actionCreator(payload);
      dispatch(action);

      setState({ isPending: false, isError: false, error: null });

      if (onSuccess) {
        onSuccess(payload);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      setState({ isPending: false, isError: true, error: err });

      // Rollback optimistic update
      if (onRollback) {
        onRollback(payload);
      }

      if (onError) {
        onError(err, payload);
      }
    }
  }, [dispatch, actionCreator, onOptimistic, onSuccess, onError, onRollback]);

  return { execute, ...state };
}

/**
 * useActionCreators hook - bind multiple action creators
 */
export function useActionCreators<
  AC extends Record<string, (...args: unknown[]) => AnyAction>
>(actionCreators: AC): { [K in keyof AC]: (...args: Parameters<AC[K]>) => void } {
  const dispatch = useDispatch();

  const boundCreators = useRef<{ [K in keyof AC]: (...args: Parameters<AC[K]>) => void } | null>(null);

  if (!boundCreators.current) {
    const bound: Record<string, (...args: unknown[]) => void> = {};

    for (const key of Object.keys(actionCreators)) {
      const creator = actionCreators[key];
      bound[key] = (...args: unknown[]) => {
        dispatch(creator(...args));
      };
    }

    boundCreators.current = bound as { [K in keyof AC]: (...args: Parameters<AC[K]>) => void };
  }

  return boundCreators.current;
}

