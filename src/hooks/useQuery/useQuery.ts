/**
 * Synapse - useQuery Hook
 * API calls with loading, error, and data states
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios, { 
  AxiosError, 
  AxiosResponse, 
  CancelTokenSource 
} from "axios";
import type { 
  ApiState, 
  ApiStatus, 
  UseQueryOptions, 
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
} from "@types/api.types";
import { getConfig } from "@config/configLoader";
import { logger } from "@utils/logger";
import { DEFAULT_API_TIMEOUT, MAX_RETRY_ATTEMPTS, RETRY_DELAY_BASE } from "@consts/numbers";

/**
 * Create initial API state
 */
function createInitialState<T>(): ApiState<T> {
  return {
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    status: "idle" as ApiStatus,
    headers: null,
    statusCode: null,
    response: null,
  };
}

/**
 * Get axios instance with config
 */
function getAxiosInstance() {
  const config = getConfig();
  
  return axios.create({
    baseURL: config?.api?.baseURL || "",
    timeout: config?.api?.timeout || DEFAULT_API_TIMEOUT,
    headers: config?.api?.headers || {},
  });
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * useQuery hook - fetch data with automatic state management
 */
export function useQuery<T = unknown, E = Error>(
  options: UseQueryOptions<T>
): UseQueryResult<T, E> {
  const {
    url,
    method = "GET",
    data: requestData,
    params,
    headers,
    enabled = true,
    refetchInterval,
    refetchOnFocus = false,
    refetchOnReconnect = false,
    keepPreviousData = false,
    onSuccess,
    onError,
    initialData,
    select,
    ...axiosConfig
  } = options;

  const [state, setState] = useState<ApiState<T, E>>(() => ({
    ...createInitialState<T>(),
    data: initialData ?? null,
  }));

  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const mountedRef = useRef(true);
  const previousDataRef = useRef<T | null>(initialData ?? null);

  /**
   * Fetch data
   */
  const fetchData = useCallback(async () => {
    if (!url) return;

    // Cancel previous request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("New request initiated");
    }

    cancelTokenRef.current = axios.CancelToken.source();

    setState(prev => ({
      ...prev,
      isLoading: true,
      status: "loading" as ApiStatus,
      error: null,
      isError: false,
      ...(keepPreviousData ? {} : { data: null }),
    }));

    const axiosInstance = getAxiosInstance();
    const config = getConfig();
    const retryConfig = config?.api?.retry;

    let attempts = 0;
    const maxAttempts = retryConfig?.enabled 
      ? retryConfig.maxAttempts 
      : 1;

    while (attempts < maxAttempts) {
      try {
        const response: AxiosResponse<T> = await axiosInstance.request({
          url,
          method,
          data: requestData,
          params,
          headers,
          cancelToken: cancelTokenRef.current.token,
          ...axiosConfig,
        });

        if (!mountedRef.current) return;

        let processedData = response.data;
        if (select) {
          processedData = select(processedData);
        }

        const responseHeaders: Record<string, string> = {};
        Object.entries(response.headers).forEach(([key, value]) => {
          if (typeof value === "string") {
            responseHeaders[key] = value;
          }
        });

        setState({
          data: processedData,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
          status: "success" as ApiStatus,
          headers: responseHeaders,
          statusCode: response.status,
          response,
        });

        previousDataRef.current = processedData;

        if (onSuccess) {
          onSuccess(processedData);
        }

        logger.debug("API request successful:", url, response.status);
        return;

      } catch (err) {
        attempts++;

        if (axios.isCancel(err)) {
          logger.debug("Request cancelled:", url);
          return;
        }

        const axiosError = err as AxiosError;

        if (attempts < maxAttempts && retryConfig?.enabled) {
          const delay = retryConfig.delay * Math.pow(2, attempts - 1);
          logger.debug(`Retrying request (${attempts}/${maxAttempts}) after ${delay}ms`);
          await sleep(delay);
          continue;
        }

        if (!mountedRef.current) return;

        const error = (axiosError.response?.data || axiosError) as E;

        setState(prev => ({
          ...prev,
          data: keepPreviousData ? previousDataRef.current : null,
          error,
          isLoading: false,
          isSuccess: false,
          isError: true,
          status: "error" as ApiStatus,
          statusCode: axiosError.response?.status ?? null,
        }));

        if (onError) {
          onError(error instanceof Error ? error : new Error(String(error)));
        }

        logger.error("API request failed:", url, err);
      }
    }
  }, [
    url, 
    method, 
    requestData, 
    params, 
    headers, 
    axiosConfig, 
    keepPreviousData, 
    onSuccess, 
    onError, 
    select
  ]);

  /**
   * Cancel request
   */
  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("Request cancelled by user");
      cancelTokenRef.current = null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancel();
    setState({
      ...createInitialState<T>(),
      data: initialData ?? null,
    });
  }, [cancel, initialData]);

  /**
   * Refetch data
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled, fetchData]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, enabled, fetchData]);

  // Refetch on focus
  useEffect(() => {
    if (!refetchOnFocus || !enabled) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetchOnFocus, enabled, fetchData]);

  // Refetch on reconnect
  useEffect(() => {
    if (!refetchOnReconnect || !enabled) return;

    const handleOnline = () => {
      fetchData();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [refetchOnReconnect, enabled, fetchData]);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return useMemo(() => ({
    ...state,
    refetch,
    cancel,
    reset,
  }), [state, refetch, cancel, reset]);
}

/**
 * useMutation hook - for POST/PUT/DELETE requests
 */
export function useMutation<T = unknown, V = unknown, E = Error>(
  options: UseMutationOptions<T, V> & { url?: string; method?: string }
): UseMutationResult<T, V, E> {
  const { url, method = "POST", onSuccess, onError, onSettled } = options;

  const [state, setState] = useState<ApiState<T, E>>(createInitialState<T>());
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);
  const mountedRef = useRef(true);

  /**
   * Execute mutation
   */
  const mutateAsync = useCallback(async (variables: V): Promise<T> => {
    // Cancel previous request
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("New mutation initiated");
    }

    cancelTokenRef.current = axios.CancelToken.source();

    setState(prev => ({
      ...prev,
      isLoading: true,
      status: "loading" as ApiStatus,
      error: null,
      isError: false,
    }));

    const axiosInstance = getAxiosInstance();

    try {
      const response: AxiosResponse<T> = await axiosInstance.request({
        url,
        method,
        data: variables,
        cancelToken: cancelTokenRef.current.token,
      });

      if (!mountedRef.current) throw new Error("Component unmounted");

      const responseHeaders: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          responseHeaders[key] = value;
        }
      });

      setState({
        data: response.data,
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
        status: "success" as ApiStatus,
        headers: responseHeaders,
        statusCode: response.status,
        response,
      });

      if (onSuccess) {
        onSuccess(response.data, variables);
      }

      if (onSettled) {
        onSettled(response.data, null, variables);
      }

      return response.data;

    } catch (err) {
      if (axios.isCancel(err)) {
        throw err;
      }

      const axiosError = err as AxiosError;
      const error = (axiosError.response?.data || axiosError) as E;

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error,
          isLoading: false,
          isSuccess: false,
          isError: true,
          status: "error" as ApiStatus,
          statusCode: axiosError.response?.status ?? null,
        }));
      }

      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)), variables);
      }

      if (onSettled) {
        onSettled(undefined, error instanceof Error ? error : new Error(String(error)), variables);
      }

      throw error;
    }
  }, [url, method, onSuccess, onError, onSettled]);

  /**
   * Execute mutation (fire and forget)
   */
  const mutate = useCallback((variables: V): void => {
    mutateAsync(variables).catch(() => {
      // Error is already handled in mutateAsync
    });
  }, [mutateAsync]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel("Mutation reset");
    }
    setState(createInitialState<T>());
  }, []);

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel("Component unmounted");
      }
    };
  }, []);

  return useMemo(() => ({
    ...state,
    mutate: mutate as unknown as (variables: V) => Promise<T>,
    mutateAsync,
    reset,
  }), [state, mutate, mutateAsync, reset]);
}

/**
 * useLazyQuery hook - query that doesn't execute immediately
 */
export function useLazyQuery<T = unknown, E = Error>(
  options: Omit<UseQueryOptions<T>, "enabled">
): [() => Promise<void>, UseQueryResult<T, E>] {
  const [enabled, setEnabled] = useState(false);
  
  const result = useQuery<T, E>({
    ...options,
    enabled,
  });

  const execute = useCallback(async () => {
    setEnabled(true);
  }, []);

  return [execute, result];
}

