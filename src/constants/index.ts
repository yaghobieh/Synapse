export const VERSION = '1.0.0';

export const SYNAPSE_PREFIX = 'synapse';
export const DEVTOOLS_KEY = '__SYNAPSE_DEVTOOLS__';
export const PERSIST_KEY_PREFIX = 'synapse:';

export const DEFAULT_CONFIG = {
  actionNaming: 'camelCase' as const,
  devtools: process.env.NODE_ENV !== 'production',
  devtoolsName: 'Synapse',
  logging: false,
  persist: false,
};

export const DEFAULT_API_CONFIG = {
  timeout: 30000,
  retry: {
    count: 3,
    delay: 1000,
    backoff: 2,
  },
};

export const STORAGE_KEYS = {
  STATE: 'state',
  VERSION: 'version',
  TIMESTAMP: 'timestamp',
} as const;

export const INTERNAL_ACTIONS = {
  INIT: '@@synapse/INIT',
  RESET: '@@synapse/RESET',
  SET: '@@synapse/SET',
  HYDRATE: '@@synapse/HYDRATE',
} as const;

export const DEVTOOLS_MESSAGES = {
  INIT: 'INIT',
  STATE_CHANGE: 'STATE_CHANGE',
  ACTION: 'ACTION',
  TIME_TRAVEL: 'TIME_TRAVEL',
  RESET: 'RESET',
  IMPORT_STATE: 'IMPORT_STATE',
  EXPORT_STATE: 'EXPORT_STATE',
} as const;

export const NUMBERS = {
  DEFAULT_TIMEOUT: 30000,
  MAX_HISTORY: 100,
  DEBOUNCE_DELAY: 100,
  PERSIST_THROTTLE: 1000,
} as const;

export * from './nucleus.const';
export * from './signal.const';
export * from './devtools.const';
export * from './api.const';
