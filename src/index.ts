/**
 * Synapse - A thin, powerful state management library for React
 * 
 * @packageDocumentation
 */

// Core exports
export {
  createStore,
  configureStore,
  combineReducers,
  createReducer,
  reduceReducers,
  createSlice,
  createAsyncThunk,
  loggerMiddleware,
  thunkMiddleware,
  dispatchActionsMiddleware,
  crashReporterMiddleware,
  devToolsMiddleware,
  batchMiddleware,
  applyMiddleware,
} from "./core";

// Hooks exports
export {
  // Provider and Context
  SynapseProvider,
  useSynapseContext,
  useStore,
  createSynapseContext,
  // useSelector
  useSelector,
  useShallowSelector,
  useSelectorWithEquality,
  createSelectorHook,
  // useDispatch
  useDispatch,
  createDispatchHook,
  bindActionCreator,
  bindActionCreators,
  useActions,
  useAction,
  useBatchDispatch,
  // useQuery
  useQuery,
  useMutation,
  useLazyQuery,
  // useSaga
  useTakeAction,
  useActionCallback,
  useTakeEvery,
  useTakeLatest,
  useTakeLeading,
  useDebounceAction,
  useThrottleAction,
  useActionHistory,
  // useAction
  useActionStatus,
  useAsyncAction,
  useOptimisticAction,
  useActionCreators,
} from "./hooks";
export type { SynapseProviderProps } from "./hooks";

// API exports
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
  createApiMiddleware,
  createApiAction,
  createGetAction,
  createPostAction,
  createPutAction,
  createDeleteAction,
  createPatchAction,
} from "./api";
export type { ApiMiddlewareOptions } from "./api";

// Saga exports
export {
  take,
  takeEvery,
  takeLatest,
  takeLeading,
  put,
  call,
  callWithContext,
  select,
  delay,
  fork,
  spawn,
  cancel,
  all,
  race,
  debounce,
  throttle,
  retry,
  actionChannel,
  createSagaMiddleware,
  runRootSaga,
} from "./saga";

// Config exports
export {
  initConfig,
  getConfig,
  updateConfig,
  resetConfig,
  loadConfigFromFile,
  saveConfigToFile,
  validateConfig,
} from "./config";

// Utils exports
export {
  logger,
  createScopedLogger,
  isPlainObject,
  isFunction,
  isPromise,
  isGenerator,
  isGeneratorFunction,
  deepFreeze,
  shallowEqual,
  convertCase,
  generateId,
  compose,
  debounce as debounceUtil,
  throttle as throttleUtil,
  deepClone,
  getNestedValue,
  setNestedValue,
} from "./utils";

// Type exports
export type {
  // Store types
  State,
  Listener,
  Unsubscribe,
  Dispatch,
  GetState,
  Store,
  StoreCreator,
  StoreEnhancer,
  CreateStoreOptions,
  ReducersMapObject,
  SliceConfig,
  Slice,
  // Action types
  Action,
  PayloadAction,
  MetaAction,
  ErrorAction,
  AnyAction,
  Reducer,
  ActionCreator,
  PayloadActionCreator,
  CaseReducer,
  CaseReducers,
  ActionCase,
  ThunkAction,
  BatchAction,
  // Middleware types
  MiddlewareAPI,
  Middleware,
  ComposedMiddleware,
  MiddlewareOptions,
  LoggerMiddlewareOptions,
  ThunkMiddlewareOptions,
  ApiMiddlewareOptions as ApiMiddlewareConfig,
  // Config types
  ActionTypeConfig,
  DispatchConfig,
  DebugConfig,
  ApiConfig,
  CliConfig,
  SynapseConfig,
  PartialSynapseConfig,
  // API types
  ApiStatus,
  ApiState,
  ApiRequestConfig,
  ApiActionPayload,
  ApiRequestAction,
  ApiSuccessAction,
  ApiErrorAction,
  UseQueryOptions,
  UseQueryResult,
  UseMutationOptions,
  UseMutationResult,
  // Saga types
  EffectType,
  Effect,
  TakeEffect,
  PutEffect,
  CallEffect,
  SelectEffect,
  DelayEffect,
  ForkEffect,
  CancelEffect,
  AllEffect,
  RaceEffect,
  Task,
  SagaContext,
  Saga,
  SagaMiddlewareOptions,
  SagaMonitor,
  Channel,
  ActionChannelConfig,
  // Hooks types
  Selector,
  EqualityFn,
  UseSelectorOptions,
  UseDispatchResult,
  UseActionOptions,
  BoundActionCreator,
  ActionStatus,
  UseActionStatusResult,
  StoreContextValue,
} from "./types";

// Constants exports
export {
  // Numbers
  DEFAULT_API_TIMEOUT,
  DEFAULT_DEBOUNCE_DELAY,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY_BASE,
  MAX_CHANNEL_LISTENERS,
  DEFAULT_CACHE_TTL,
  BATCH_DISPATCH_DELAY,
  DEVTOOLS_BUFFER_SIZE,
  ACTION_HISTORY_LIMIT,
  // Strings
  LIB_NAME,
  CONFIG_FILE_NAME,
  DEFAULT_STORE_PATH,
  DEFAULT_SLICES_PATH,
  ACTION_PREFIX_START,
  ACTION_PREFIX_END,
  ACTION_PREFIX_SUCCESS,
  ACTION_PREFIX_ERROR,
  DEVTOOLS_EXTENSION_ID,
  // Action types
  SYNAPSE_INIT,
  SYNAPSE_RESET,
  SYNAPSE_HYDRATE,
  SYNAPSE_BATCH,
  API_REQUEST,
  API_SUCCESS,
  API_FAILURE,
  API_CANCEL,
  SAGA_START,
  SAGA_END,
  SAGA_CANCEL,
  SAGA_ERROR,
  DEVTOOLS_CONNECT,
  DEVTOOLS_DISCONNECT,
  DEVTOOLS_JUMP,
} from "./consts";

