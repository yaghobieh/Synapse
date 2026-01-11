/**
 * Synapse - String Constants
 * All string values used throughout the library
 */

/** Library name */
export const LIB_NAME = "synapse";

/** Config file name */
export const CONFIG_FILE_NAME = "synapse.config.json";

/** Default store path */
export const DEFAULT_STORE_PATH = "./src/store";

/** Default slices path */
export const DEFAULT_SLICES_PATH = "./src/store/slices";

/** Action type prefixes */
export const ACTION_PREFIX_START = "_START";
export const ACTION_PREFIX_END = "_END";
export const ACTION_PREFIX_SUCCESS = "_SUCCESS";
export const ACTION_PREFIX_ERROR = "_ERROR";

/** DevTools extension ID */
export const DEVTOOLS_EXTENSION_ID = "synapse-devtools";

/** Storage keys */
export const STORAGE_KEY_STATE = "synapse_state";
export const STORAGE_KEY_ACTIONS = "synapse_actions";

/** Event names */
export const EVENT_STATE_CHANGE = "synapse:state:change";
export const EVENT_ACTION_DISPATCH = "synapse:action:dispatch";
export const EVENT_MIDDLEWARE_ERROR = "synapse:middleware:error";

/** Log prefixes */
export const LOG_PREFIX = "[Synapse]";
export const LOG_PREFIX_WARN = "[Synapse:WARN]";
export const LOG_PREFIX_ERROR = "[Synapse:ERROR]";
export const LOG_PREFIX_DEBUG = "[Synapse:DEBUG]";

