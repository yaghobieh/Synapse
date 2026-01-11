/**
 * Synapse - Axios Instance
 * Configured axios instance for API calls
 */

import axios, { 
  AxiosError, 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse,
  InternalAxiosRequestConfig
} from "axios";
import { getConfig } from "@config/configLoader";
import { logger } from "@utils/logger";
import { DEFAULT_API_TIMEOUT, MAX_RETRY_ATTEMPTS, RETRY_DELAY_BASE } from "@consts/numbers";

/**
 * Request interceptor function
 */
type RequestInterceptor = (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

/**
 * Response interceptor function
 */
type ResponseInterceptor = (
  response: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>;

/**
 * Error interceptor function
 */
type ErrorInterceptor = (error: AxiosError) => Promise<AxiosResponse | never>;

/**
 * Interceptor store
 */
interface InterceptorStore {
  request: RequestInterceptor[];
  response: ResponseInterceptor[];
  error: ErrorInterceptor[];
}

/**
 * Global interceptors
 */
const globalInterceptors: InterceptorStore = {
  request: [],
  response: [],
  error: [],
};

/**
 * Create configured axios instance
 */
export function createAxiosInstance(customConfig?: AxiosRequestConfig): AxiosInstance {
  const synapseConfig = getConfig();
  const apiConfig = synapseConfig?.api;

  const instance = axios.create({
    baseURL: apiConfig?.baseURL || "",
    timeout: apiConfig?.timeout || DEFAULT_API_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
      ...apiConfig?.headers,
    },
    ...customConfig,
  });

  // Add request logging interceptor
  instance.interceptors.request.use(
    (config) => {
      logger.debug("API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        data: config.data,
      });

      return config;
    },
    (error) => {
      logger.error("Request Error:", error);
      return Promise.reject(error);
    }
  );

  // Add response logging interceptor
  instance.interceptors.response.use(
    (response) => {
      logger.debug("API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });

      return response;
    },
    (error: AxiosError) => {
      logger.error("Response Error:", {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
      });

      return Promise.reject(error);
    }
  );

  // Apply global interceptors
  globalInterceptors.request.forEach((interceptor) => {
    instance.interceptors.request.use(interceptor);
  });

  globalInterceptors.response.forEach((interceptor) => {
    instance.interceptors.response.use(interceptor);
  });

  globalInterceptors.error.forEach((interceptor) => {
    instance.interceptors.response.use(undefined, interceptor);
  });

  return instance;
}

/**
 * Add global request interceptor
 */
export function addRequestInterceptor(interceptor: RequestInterceptor): () => void {
  globalInterceptors.request.push(interceptor);
  
  return () => {
    const index = globalInterceptors.request.indexOf(interceptor);
    if (index > -1) {
      globalInterceptors.request.splice(index, 1);
    }
  };
}

/**
 * Add global response interceptor
 */
export function addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
  globalInterceptors.response.push(interceptor);
  
  return () => {
    const index = globalInterceptors.response.indexOf(interceptor);
    if (index > -1) {
      globalInterceptors.response.splice(index, 1);
    }
  };
}

/**
 * Add global error interceptor
 */
export function addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
  globalInterceptors.error.push(interceptor);
  
  return () => {
    const index = globalInterceptors.error.indexOf(interceptor);
    if (index > -1) {
      globalInterceptors.error.splice(index, 1);
    }
  };
}

/**
 * Clear all global interceptors
 */
export function clearInterceptors(): void {
  globalInterceptors.request = [];
  globalInterceptors.response = [];
  globalInterceptors.error = [];
}

/**
 * Default axios instance
 */
let defaultInstance: AxiosInstance | null = null;

/**
 * Get default axios instance
 */
export function getAxiosInstance(): AxiosInstance {
  if (!defaultInstance) {
    defaultInstance = createAxiosInstance();
  }
  return defaultInstance;
}

/**
 * Set default axios instance
 */
export function setAxiosInstance(instance: AxiosInstance): void {
  defaultInstance = instance;
}

/**
 * Reset default axios instance
 */
export function resetAxiosInstance(): void {
  defaultInstance = null;
}

/**
 * Create retry interceptor
 */
export function createRetryInterceptor(
  maxRetries: number = MAX_RETRY_ATTEMPTS,
  retryDelay: number = RETRY_DELAY_BASE
): ErrorInterceptor {
  return async (error: AxiosError): Promise<AxiosResponse | never> => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    if (!config) {
      return Promise.reject(error);
    }

    config._retryCount = config._retryCount || 0;

    if (config._retryCount >= maxRetries) {
      return Promise.reject(error);
    }

    config._retryCount++;

    // Exponential backoff
    const delay = retryDelay * Math.pow(2, config._retryCount - 1);
    
    logger.debug(`Retrying request (${config._retryCount}/${maxRetries}) after ${delay}ms`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    return axios(config);
  };
}

/**
 * Create auth interceptor
 */
export function createAuthInterceptor(
  getToken: () => string | null | Promise<string | null>
): RequestInterceptor {
  return async (config) => {
    const token = await getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  };
}

/**
 * Create refresh token interceptor
 */
export function createRefreshTokenInterceptor(options: {
  isTokenExpiredError: (error: AxiosError) => boolean;
  refreshToken: () => Promise<string>;
  onRefreshSuccess?: (newToken: string) => void;
  onRefreshError?: (error: Error) => void;
}): ErrorInterceptor {
  let isRefreshing = false;
  let refreshSubscribers: Array<(token: string) => void> = [];

  const { isTokenExpiredError, refreshToken, onRefreshSuccess, onRefreshError } = options;

  const subscribeTokenRefresh = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
  };

  const onTokenRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
  };

  return async (error: AxiosError): Promise<AxiosResponse | never> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest || !isTokenExpiredError(error)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axios(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshToken();
      
      onTokenRefreshed(newToken);
      
      if (onRefreshSuccess) {
        onRefreshSuccess(newToken);
      }

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      isRefreshing = false;

      return axios(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      
      if (onRefreshError) {
        onRefreshError(refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
      }

      return Promise.reject(refreshError);
    }
  };
}

