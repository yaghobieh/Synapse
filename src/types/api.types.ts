/**
 * Synapse - API Types
 * Type definitions for API-related functionality
 */

import type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import type { Action, PayloadAction } from "./action.types";

/**
 * API request status
 */
export enum ApiStatus {
  IDLE = "idle",
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

/**
 * API state for useQuery hook
 */
export interface ApiState<T = unknown, E = Error> {
  /** Response data */
  data: T | null;
  
  /** Error object if request failed */
  error: E | null;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Success state */
  isSuccess: boolean;
  
  /** Error state */
  isError: boolean;
  
  /** Current status */
  status: ApiStatus;
  
  /** Response headers */
  headers: Record<string, string> | null;
  
  /** HTTP status code */
  statusCode: number | null;
  
  /** Original response object */
  response: AxiosResponse<T> | null;
}

/**
 * API request configuration
 */
export interface ApiRequestConfig extends AxiosRequestConfig {
  /** Action type for the request */
  actionType?: string;
  
  /** Whether to dispatch start/end actions */
  dispatchActions?: boolean;
  
  /** Transform response data */
  transformResponse?: (data: unknown) => unknown;
  
  /** Transform error */
  transformError?: (error: AxiosError) => Error;
  
  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttl: number;
    key?: string;
  };
}

/**
 * API action payload
 */
export interface ApiActionPayload<T = unknown> {
  /** Request configuration */
  config: ApiRequestConfig;
  
  /** Response data */
  data?: T;
  
  /** Error */
  error?: Error;
  
  /** Metadata */
  meta?: {
    timestamp: number;
    duration?: number;
    cached?: boolean;
  };
}

/**
 * API request action
 */
export interface ApiRequestAction extends PayloadAction<ApiRequestConfig> {
  type: string;
  meta: {
    api: true;
    timestamp: number;
  };
}

/**
 * API success action
 */
export interface ApiSuccessAction<T = unknown> extends Action {
  type: string;
  payload: T;
  meta: {
    api: true;
    timestamp: number;
    duration: number;
    headers: Record<string, string>;
    statusCode: number;
  };
}

/**
 * API error action
 */
export interface ApiErrorAction extends Action {
  type: string;
  payload: Error;
  error: true;
  meta: {
    api: true;
    timestamp: number;
    statusCode?: number;
  };
}

/**
 * useQuery options
 */
export interface UseQueryOptions<T = unknown> extends ApiRequestConfig {
  /** Whether to fetch on mount */
  enabled?: boolean;
  
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
  
  /** Refetch on window focus */
  refetchOnFocus?: boolean;
  
  /** Refetch on reconnect */
  refetchOnReconnect?: boolean;
  
  /** Keep previous data while fetching */
  keepPreviousData?: boolean;
  
  /** On success callback */
  onSuccess?: (data: T) => void;
  
  /** On error callback */
  onError?: (error: Error) => void;
  
  /** Initial data */
  initialData?: T;
  
  /** Select/transform data */
  select?: (data: T) => T;
}

/**
 * useQuery return type
 */
export interface UseQueryResult<T = unknown, E = Error> extends ApiState<T, E> {
  /** Refetch the data */
  refetch: () => Promise<void>;
  
  /** Cancel ongoing request */
  cancel: () => void;
  
  /** Reset to initial state */
  reset: () => void;
}

/**
 * useMutation options
 */
export interface UseMutationOptions<T = unknown, V = unknown> {
  /** On success callback */
  onSuccess?: (data: T, variables: V) => void;
  
  /** On error callback */
  onError?: (error: Error, variables: V) => void;
  
  /** On settled callback (success or error) */
  onSettled?: (data: T | undefined, error: Error | null, variables: V) => void;
}

/**
 * useMutation return type
 */
export interface UseMutationResult<T = unknown, V = unknown, E = Error> extends ApiState<T, E> {
  /** Execute the mutation */
  mutate: (variables: V) => Promise<T>;
  
  /** Execute mutation and return promise */
  mutateAsync: (variables: V) => Promise<T>;
  
  /** Reset mutation state */
  reset: () => void;
}

