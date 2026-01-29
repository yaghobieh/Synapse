export const API_DEFAULTS = {
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000,
  RETRY_BACKOFF: 2,
  MAX_CALLS_HISTORY: 50,
} as const;

export const API_GLOBAL_KEY = '__SYNAPSE_API_CALLS__' as const;

