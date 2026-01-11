/**
 * Synapse - API Index
 * Exports all API functionality
 */

export {
  createAxiosInstance,
  getAxiosInstance,
  setAxiosInstance,
  resetAxiosInstance,
  addRequestInterceptor,
  addResponseInterceptor,
  addErrorInterceptor,
  clearInterceptors,
  createRetryInterceptor,
  createAuthInterceptor,
  createRefreshTokenInterceptor,
} from "./axiosInstance";

export {
  createApiMiddleware,
  createApiAction,
  createGetAction,
  createPostAction,
  createPutAction,
  createDeleteAction,
  createPatchAction,
} from "./apiMiddleware";
export type { ApiMiddlewareOptions } from "./apiMiddleware";

