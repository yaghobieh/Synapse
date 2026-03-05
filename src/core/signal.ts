import type { Signal, ComputedSignal, Unsubscribe } from '../types';
import { SIGNAL_DEFAULTS } from '../constants/signal.const';
import { registerSignal, syncToDevTools, syncBatchToDevTools } from '../devtools/signalDevtools';

let signalCounter = 0;
let batchDepth = 0;
let pendingUpdates: Array<() => void> = [];
let batchedChanges: string[] = [];

export function signal<T>(initialValue: T, name?: string): Signal<T> {
  let value = initialValue;
  const listeners = new Set<(value: T, prev: T) => void>();

  const signalName = name || `${SIGNAL_DEFAULTS.NAME_PREFIX}${++signalCounter}`;
  const signalId = `${SIGNAL_DEFAULTS.ID_PREFIX}${signalCounter}`;

  const sig: Signal<T> = {
    get value() { return value; },

    set value(newValue: T) { this.set(newValue); },

    set(newValue: T | ((prev: T) => T)) {
      const prev = value;
      value = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue;

      if (value !== prev) {
        listeners.forEach(listener => listener(value, prev));

        if (batchDepth > 0) {
          batchedChanges.push(signalName);
        } else {
          syncToDevTools();
        }
      }
    },

    subscribe(listener: (value: T, prev: T) => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    peek(): T { return value; },
  };

  registerSignal(signalId, signalName, () => value);
  syncToDevTools();

  return sig;
}

export function computed<T>(compute: () => T): ComputedSignal<T> {
  let cachedValue: T;
  let isDirty = true;
  const listeners = new Set<(value: T) => void>();

  const recompute = () => {
    const prev = cachedValue;
    cachedValue = compute();
    isDirty = false;
    if (cachedValue !== prev) {
      listeners.forEach(listener => listener(cachedValue));
    }
    return cachedValue;
  };

  return {
    get value() {
      if (isDirty) return recompute();
      return cachedValue;
    },
    subscribe(listener: (value: T) => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function batch(fn: () => void): void {
  batchDepth++;
  batchedChanges = [];

  try {
    fn();
  } finally {
    batchDepth--;

    if (batchDepth === 0) {
      const updates = pendingUpdates;
      const changes = [...batchedChanges];
      pendingUpdates = [];
      batchedChanges = [];

      updates.forEach(update => update());

      if (changes.length > 0) {
        syncBatchToDevTools(changes);
      }
    }
  }
}

export function effect(fn: () => void | (() => void)): Unsubscribe {
  let cleanup: void | (() => void);

  const run = () => {
    if (cleanup) cleanup();
    cleanup = fn();
  };

  run();

  return () => {
    if (cleanup) cleanup();
  };
}
