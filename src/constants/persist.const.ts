export const PERSIST_DEFAULTS = {
  NAMESPACE: 'synapse:',
  VERSION: 1,
  STORAGE: 'local',
} as const;

export const PERSIST_NUMBERS = {
  DEBOUNCE_MS: 250,
} as const;

export const PERSIST_ERRORS = {
  HYDRATE: 'Synapse persist: Failed to hydrate',
  SAVE: 'Synapse persist: Failed to save',
  CLEAR: 'Synapse persist: Failed to clear',
} as const;
