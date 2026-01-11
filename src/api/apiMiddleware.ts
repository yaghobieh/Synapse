/**
 * Synapse - API Middleware
 * Handle API actions in the middleware pipeline
 */

import axios, { AxiosError, AxiosResponse } from "axios";
import type { Action, AnyAction } from "@types/action.types";
import type { Middleware, MiddlewareAPI } from "@types/middleware.types";
import type { Dispatch, State } from "@types/store.types";
import type { ApiRequestAction, ApiRequestConfig } from "@types/api.types";
import { getAxiosInstance } from "./axiosInstance";
import { logger } from "@utils/logger";
import { 
  API_REQUEST, 
  API_SUCCESS, 
  API_FAILURE, 
  API_CANCEL 
} from "@consts/actionTypes";

/**
 * Check if action is an API request
 */
function isApiAction(action: AnyAction): action is ApiRequestAction {
  return (
    action.meta?.api === true ||
    action.type === API_REQUEST ||
    typeof (action.payload as ApiRequestConfig)?.url === "string"
  );
}

/**
 * API middleware options
 */
export interface ApiMiddlewareOptions {
  /** Transform request before sending */
  transformRequest?: (config: ApiRequestConfig) => ApiRequestConfig;
  
  /** Transform response data */
  transformResponse?: <T>(data: T, response: AxiosResponse<T>) => T;
  
  /** Transform error before dispatching */
  transformError?: (error: AxiosError) => Error;
  
  /** Custom action type generator */
  getActionTypes?: (baseType: string) => {
    request: string;
    success: string;
    failure: string;
  };
  
  /** On request start callback */
  onRequest?: (config: ApiRequestConfig) => void;
  
  /** On request success callback */
  onSuccess?: <T>(response: AxiosResponse<T>) => void;
  
  /** On request error callback */
  onError?: (error: AxiosError) => void;
}

/**
 * Create API middleware
 */
export function createApiMiddleware<S = State, A extends Action = AnyAction>(
  options: ApiMiddlewareOptions = {}
): Middleware<S, A> {
  const {
    transformRequest,
    transformResponse,
    transformError,
    getActionTypes = (baseType: string) => ({
      request: `${baseType}_REQUEST`,
      success: `${baseType}_SUCCESS`,
      failure: `${baseType}_FAILURE`,
    }),
    onRequest,
    onSuccess,
    onError,
  } = options;

  // Cancel tokens map
  const cancelTokens = new Map<string, () => void>();

  return (api: MiddlewareAPI<S, A>) => (next: Dispatch<A>) => async (action: A): Promise<A> => {
    // Pass through non-API actions
    if (!isApiAction(action as AnyAction)) {
      return next(action);
    }

    const apiAction = action as unknown as ApiRequestAction;
    let config = apiAction.payload as ApiRequestConfig;

    // Transform request if needed
    if (transformRequest) {
      config = transformRequest(config);
    }

    const baseType = config.actionType || apiAction.type.replace(/_REQUEST$/, "");
    const actionTypes = getActionTypes(baseType);

    // Create cancel token
    const cancelSource = axios.CancelToken.source();
    const cancelKey = `${baseType}_${Date.now()}`;
    
    cancelTokens.set(cancelKey, () => cancelSource.cancel("Request cancelled"));

    // Dispatch request action
    const requestAction = {
      type: actionTypes.request,
      payload: config,
      meta: {
        api: true,
        timestamp: Date.now(),
        cancelKey,
      },
    } as unknown as A;

    next(requestAction);

    if (onRequest) {
      onRequest(config);
    }

    const startTime = Date.now();

    try {
      const axiosInstance = getAxiosInstance();
      
      const response: AxiosResponse = await axiosInstance.request({
        ...config,
        cancelToken: cancelSource.token,
      });

      // Remove cancel token
      cancelTokens.delete(cancelKey);

      const duration = Date.now() - startTime;

      // Transform response if needed
      let data = response.data;
      if (transformResponse) {
        data = transformResponse(data, response);
      }

      // Extract headers
      const headers: Record<string, string> = {};
      Object.entries(response.headers).forEach(([key, value]) => {
        if (typeof value === "string") {
          headers[key] = value;
        }
      });

      // Dispatch success action
      const successAction = {
        type: actionTypes.success,
        payload: data,
        meta: {
          api: true,
          timestamp: Date.now(),
          duration,
          headers,
          statusCode: response.status,
          originalAction: apiAction,
        },
      } as unknown as A;

      next(successAction);

      if (onSuccess) {
        onSuccess(response);
      }

      logger.debug("API Success:", {
        type: actionTypes.success,
        duration: `${duration}ms`,
        status: response.status,
      });

      return successAction;

    } catch (error) {
      // Remove cancel token
      cancelTokens.delete(cancelKey);

      // Handle cancellation
      if (axios.isCancel(error)) {
        const cancelAction = {
          type: `${baseType}_CANCEL`,
          meta: {
            api: true,
            timestamp: Date.now(),
            originalAction: apiAction,
          },
        } as unknown as A;

        next(cancelAction);
        logger.debug("API Cancelled:", baseType);

        return cancelAction;
      }

      const axiosError = error as AxiosError;
      const duration = Date.now() - startTime;

      // Transform error if needed
      let processedError: Error = axiosError;
      if (transformError) {
        processedError = transformError(axiosError);
      }

      // Dispatch failure action
      const failureAction = {
        type: actionTypes.failure,
        payload: processedError,
        error: true,
        meta: {
          api: true,
          timestamp: Date.now(),
          duration,
          statusCode: axiosError.response?.status,
          originalAction: apiAction,
        },
      } as unknown as A;

      next(failureAction);

      if (onError) {
        onError(axiosError);
      }

      logger.error("API Failure:", {
        type: actionTypes.failure,
        duration: `${duration}ms`,
        status: axiosError.response?.status,
        message: axiosError.message,
      });

      return failureAction;
    }
  };
}

/**
 * Create API action
 */
export function createApiAction(
  type: string,
  config: ApiRequestConfig
): ApiRequestAction {
  return {
    type,
    payload: config,
    meta: {
      api: true,
      timestamp: Date.now(),
    },
  };
}

/**
 * Create GET API action
 */
export function createGetAction(
  type: string,
  url: string,
  params?: Record<string, unknown>
): ApiRequestAction {
  return createApiAction(type, {
    url,
    method: "GET",
    params,
  });
}

/**
 * Create POST API action
 */
export function createPostAction(
  type: string,
  url: string,
  data?: unknown
): ApiRequestAction {
  return createApiAction(type, {
    url,
    method: "POST",
    data,
  });
}

/**
 * Create PUT API action
 */
export function createPutAction(
  type: string,
  url: string,
  data?: unknown
): ApiRequestAction {
  return createApiAction(type, {
    url,
    method: "PUT",
    data,
  });
}

/**
 * Create DELETE API action
 */
export function createDeleteAction(
  type: string,
  url: string
): ApiRequestAction {
  return createApiAction(type, {
    url,
    method: "DELETE",
  });
}

/**
 * Create PATCH API action
 */
export function createPatchAction(
  type: string,
  url: string,
  data?: unknown
): ApiRequestAction {
  return createApiAction(type, {
    url,
    method: "PATCH",
    data,
  });
}

