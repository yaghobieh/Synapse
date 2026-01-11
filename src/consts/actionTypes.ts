/**
 * Synapse - Action Type Constants
 * Internal action types used by the library
 */

/** Store initialization action */
export const SYNAPSE_INIT = "@@synapse/INIT";

/** Store reset action */
export const SYNAPSE_RESET = "@@synapse/RESET";

/** State hydration action */
export const SYNAPSE_HYDRATE = "@@synapse/HYDRATE";

/** Batch actions wrapper */
export const SYNAPSE_BATCH = "@@synapse/BATCH";

/** API action types */
export const API_REQUEST = "@@synapse/API_REQUEST";
export const API_SUCCESS = "@@synapse/API_SUCCESS";
export const API_FAILURE = "@@synapse/API_FAILURE";
export const API_CANCEL = "@@synapse/API_CANCEL";

/** Saga action types */
export const SAGA_START = "@@synapse/SAGA_START";
export const SAGA_END = "@@synapse/SAGA_END";
export const SAGA_CANCEL = "@@synapse/SAGA_CANCEL";
export const SAGA_ERROR = "@@synapse/SAGA_ERROR";

/** DevTools action types */
export const DEVTOOLS_CONNECT = "@@synapse/DEVTOOLS_CONNECT";
export const DEVTOOLS_DISCONNECT = "@@synapse/DEVTOOLS_DISCONNECT";
export const DEVTOOLS_JUMP = "@@synapse/DEVTOOLS_JUMP";

