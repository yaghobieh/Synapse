export const PANEL_DEFAULTS = {
  POLL_INTERVAL: 250,
  PERF_UPDATE_INTERVAL: 1000,
  MAX_ACTIONS: 200,
  MAX_SNAPSHOTS: 10,
  MAX_UPDATE_TIMES: 100,
  MAX_PERF_BARS: 50,
} as const;

export const TABS = {
  DIFF: 'diff',
  STATE: 'state',
  ACTION: 'action',
  PERF: 'perf',
} as const;

export const MESSAGES = {
  WAITING: 'Waiting...',
  NO_STATE: 'No state',
  SELECT_ACTION: 'Select an action to see what changed',
  NO_CHANGES: 'No changes detected',
  INVALID_JSON: 'Invalid JSON',
  NO_SNAPSHOTS: 'No snapshots yet',
} as const;

