import { DEVTOOLS_KEY } from '../constants';
import { SIGNAL_DEFAULTS } from '../constants/signal.const';

const signalRegistry = new Map<string, { name: string; getValue: () => unknown }>();

export function registerSignal(id: string, name: string, getValue: () => unknown): void {
  signalRegistry.set(id, { name, getValue });
  syncToDevTools();
}

export function syncToDevTools(): void {
  if (typeof window === 'undefined') return;

  const devtools = (window as any)[DEVTOOLS_KEY];
  if (!devtools) return;

  const state: Record<string, unknown> = {};
  signalRegistry.forEach((sig) => { state[sig.name] = sig.getValue(); });

  if (Object.keys(state).length === 0) return;

  const storeId = SIGNAL_DEFAULTS.SIGNALS_STORE_ID;

  if (!devtools.nuclei[storeId]) {
    devtools.nuclei[storeId] = {
      name: SIGNAL_DEFAULTS.SIGNALS_STORE_NAME,
      state,
      actions: [],
      history: [{ state, action: SIGNAL_DEFAULTS.INIT_ACTION, timestamp: Date.now() }],
    };
    return;
  }

  const prev = devtools.nuclei[storeId].state;
  devtools.nuclei[storeId].state = state;

  const changed: string[] = [];
  Object.keys(state).forEach((key) => {
    if (JSON.stringify(state[key]) !== JSON.stringify(prev[key])) changed.push(key);
  });

  if (changed.length > 0) {
    devtools.nuclei[storeId].history.push({
      state: { ...state },
      action: changed.join(', '),
      timestamp: Date.now(),
    });
    if (devtools.nuclei[storeId].history.length > SIGNAL_DEFAULTS.MAX_HISTORY) {
      devtools.nuclei[storeId].history.shift();
    }
  }
}

export function syncBatchToDevTools(names: string[]): void {
  if (typeof window === 'undefined' || names.length === 0) return;

  const devtools = (window as any)[DEVTOOLS_KEY];
  if (!devtools) return;

  const state: Record<string, unknown> = {};
  signalRegistry.forEach((sig) => { state[sig.name] = sig.getValue(); });

  const storeId = SIGNAL_DEFAULTS.SIGNALS_STORE_ID;

  if (!devtools.nuclei[storeId]) {
    devtools.nuclei[storeId] = {
      name: SIGNAL_DEFAULTS.SIGNALS_STORE_NAME,
      state,
      actions: [],
      history: [{ state, action: SIGNAL_DEFAULTS.INIT_ACTION, timestamp: Date.now() }],
    };
    return;
  }

  devtools.nuclei[storeId].state = state;
  devtools.nuclei[storeId].history.push({
    state: { ...state },
    action: SIGNAL_DEFAULTS.BATCH_PREFIX + names.join(', '),
    timestamp: Date.now(),
  });
}
