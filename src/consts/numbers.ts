/**
 * Synapse - Numeric Constants
 * All numeric values used throughout the library
 */

/** Default timeout for API requests in milliseconds */
export const DEFAULT_API_TIMEOUT = 30000;

/** Default debounce delay in milliseconds */
export const DEFAULT_DEBOUNCE_DELAY = 300;

/** Maximum retry attempts for failed API calls */
export const MAX_RETRY_ATTEMPTS = 3;

/** Retry delay base in milliseconds (exponential backoff) */
export const RETRY_DELAY_BASE = 1000;

/** Maximum listeners per action channel */
export const MAX_CHANNEL_LISTENERS = 100;

/** Default cache TTL in milliseconds (5 minutes) */
export const DEFAULT_CACHE_TTL = 300000;

/** Batch dispatch delay in milliseconds */
export const BATCH_DISPATCH_DELAY = 16;

/** DevTools message buffer size */
export const DEVTOOLS_BUFFER_SIZE = 100;

/** Action history limit */
export const ACTION_HISTORY_LIMIT = 50;

