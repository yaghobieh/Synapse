export const NUCLEUS_ERRORS = {
  DESTROYED_GET: 'Cannot get state from a destroyed nucleus',
  DESTROYED_SET: 'Cannot set state on a destroyed nucleus',
  DESTROYED_SUBSCRIBE: 'Cannot subscribe to a destroyed nucleus',
} as const;

export const NUCLEUS_DEFAULTS = {
  DEVTOOLS_NAME: 'Nucleus',
} as const;

