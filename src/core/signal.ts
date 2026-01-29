/**
 * Signal - Reactive primitive for fine-grained reactivity
 */

import type { Signal, ComputedSignal, Unsubscribe } from '../types';
import { DEVTOOLS_KEY } from '../constants';

// Signal registry for DevTools
const signalRegistry = new Map<string, { name: string; getValue: () => unknown }>();
let signalCounter = 0;

// Batch state - defined early so it can be used in signal()
let batchDepth = 0;
let pendingUpdates: Array<() => void> = [];
let batchedChanges: string[] = [];

/**
 * Check if currently in batch mode
 */
function isInBatch(): boolean {
  return batchDepth > 0;
}

/**
 * Track a signal change during batch
 */
function trackBatchChange(name: string): void {
  if (batchDepth > 0) {
    batchedChanges.push(name);
  }
}

/**
 * Update DevTools with current signals state
 */
function updateSignalsDevTools(): void {
  if (typeof window === 'undefined') return;
  
  const devtools = (window as any)[DEVTOOLS_KEY];
  if (!devtools) return;
  
  const signalsState: Record<string, unknown> = {};
  signalRegistry.forEach((signal) => {
    signalsState[signal.name] = signal.getValue();
  });
  
  if (Object.keys(signalsState).length === 0) return;
  
  if (!devtools.nuclei['__signals__']) {
    devtools.nuclei['__signals__'] = {
      name: 'Signals',
      state: signalsState,
      actions: [],
      history: [{
        state: signalsState,
        action: 'INIT',
        timestamp: Date.now(),
      }],
    };
  } else {
    const prevState = devtools.nuclei['__signals__'].state;
    devtools.nuclei['__signals__'].state = signalsState;
    
    const changedKeys: string[] = [];
    Object.keys(signalsState).forEach((key) => {
      if (JSON.stringify(signalsState[key]) !== JSON.stringify(prevState[key])) {
        changedKeys.push(key);
      }
    });
    
    if (changedKeys.length > 0) {
      devtools.nuclei['__signals__'].history.push({
        state: { ...signalsState },
        action: changedKeys.join(', '),
        timestamp: Date.now(),
      });
      
      if (devtools.nuclei['__signals__'].history.length > 100) {
        devtools.nuclei['__signals__'].history.shift();
      }
    }
  }
}

/**
 * Update DevTools after batch completes
 */
function updateSignalsDevToolsBatch(actionName: string): void {
  if (typeof window === 'undefined') return;
  
  const devtools = (window as any)[DEVTOOLS_KEY];
  if (!devtools) return;
  
  const signalsState: Record<string, unknown> = {};
  signalRegistry.forEach((signal) => {
    signalsState[signal.name] = signal.getValue();
  });
  
  if (!devtools.nuclei['__signals__']) {
    devtools.nuclei['__signals__'] = {
      name: 'Signals',
      state: signalsState,
      actions: [],
      history: [{
        state: signalsState,
        action: 'INIT',
        timestamp: Date.now(),
      }],
    };
  }
  
  devtools.nuclei['__signals__'].state = signalsState;
  devtools.nuclei['__signals__'].history.push({
    state: { ...signalsState },
    action: actionName,
    timestamp: Date.now(),
  });
}

/**
 * Creates a reactive signal
 */
export function signal<T>(initialValue: T, name?: string): Signal<T> {
  let value = initialValue;
  const listeners = new Set<(value: T, prev: T) => void>();
  
  const signalName = name || `signal_${++signalCounter}`;
  const signalId = `sig_${signalCounter}`;
  
  const sig: Signal<T> = {
    get value() {
      return value;
    },
    
    set value(newValue: T) {
      this.set(newValue);
    },
    
    set(newValue: T | ((prev: T) => T)) {
      const prev = value;
      value = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev) 
        : newValue;
      
      if (value !== prev) {
        listeners.forEach(listener => listener(value, prev));
        
        if (isInBatch()) {
          trackBatchChange(signalName);
        } else {
          updateSignalsDevTools();
        }
      }
    },
    
    subscribe(listener: (value: T, prev: T) => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    
    peek(): T {
      return value;
    },
  };
  
  signalRegistry.set(signalId, {
    name: signalName,
    getValue: () => value,
  });
  
  updateSignalsDevTools();
  
  return sig;
}

/**
 * Creates a computed signal that derives from other signals
 */
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
      if (isDirty) {
        return recompute();
      }
      return cachedValue;
    },
    
    subscribe(listener: (value: T) => void): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Batch multiple signal updates together
 */
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
        updateSignalsDevToolsBatch('BATCH: ' + changes.join(', '));
      }
    }
  }
}

/**
 * Effect - Run side effects when signals change
 */
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
