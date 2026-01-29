/**
 * DevTools Connector - Connect Synapse to browser DevTools
 */

import type { Nucleus, DevToolsMessage, DevToolsState } from '../types';
import { DEVTOOLS_KEY, DEVTOOLS_MESSAGES, NUMBERS } from '../constants';

// Track registered nuclei by name to prevent duplicates
const registeredNuclei: Map<string, Nucleus<object>> = new Map();

// Track if currently time-traveling to avoid adding to history
let isTimeTraveling = false;

// Track the current action being executed
let currentActionName: string | null = null;

// Cleanup tracker for StrictMode double-mount
const cleanupTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

/**
 * Set the current action name (called before action executes)
 */
export function setCurrentAction(name: string | null): void {
  currentActionName = name;
}

/**
 * Get and clear the current action name
 */
function getAndClearAction(): string {
  const action = currentActionName || 'SET';
  currentActionName = null;
  return action;
}

/**
 * Serialize state by removing ALL functions - only show pure data
 */
function serializeState<T>(state: T): Record<string, unknown> {
  if (state === null) return {};
  if (state === undefined) return {};
  if (typeof state !== 'object') return {};
  
  // Handle arrays
  if (Array.isArray(state)) {
    return state.map(item => {
      if (item === null || item === undefined) return item;
      if (typeof item === 'function') return undefined;
      if (typeof item === 'object') return serializeState(item);
      return item;
    }).filter(item => item !== undefined) as unknown as Record<string, unknown>;
  }
  
  const result: Record<string, unknown> = {};
  
  for (const key of Object.keys(state)) {
    const value = (state as Record<string, unknown>)[key];
    
    // SKIP all functions - don't even show placeholder
    if (typeof value === 'function') continue;
    
    // Skip internal/private keys
    if (key.startsWith('_')) continue;
    
    // Handle nested objects
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[key] = value.map(item => {
          if (item === null || item === undefined) return item;
          if (typeof item === 'function') return undefined;
          if (typeof item === 'object') return serializeState(item);
          return item;
        }).filter(item => item !== undefined);
      } else {
        result[key] = serializeState(value);
      }
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Get action names from state
 */
function getActionNames<T>(state: T): string[] {
  if (!state || typeof state !== 'object') return [];
  
  const actions: string[] = [];
  for (const key in state) {
    if (typeof (state as Record<string, unknown>)[key] === 'function') {
      actions.push(key);
    }
  }
  return actions;
}

/**
 * DevTools connection state
 */
interface DevToolsConnection {
  isConnected: boolean;
  history: DevToolsMessage[];
}

const connection: DevToolsConnection = {
  isConnected: false,
  history: [],
};

/**
 * Initialize DevTools if running in browser
 */
function initDevTools(): void {
  if (typeof window === 'undefined') return;
  
  // Create global state for DevTools extension
  (window as Window & { [DEVTOOLS_KEY]?: DevToolsState })[DEVTOOLS_KEY] = {
    nuclei: {},
  };
  
  // Listen for messages from DevTools extension
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    
    const { type, payload, nucleusId } = event.data || {};
    
    if (type === 'SYNAPSE_DEVTOOLS_TIME_TRAVEL' && nucleusId) {
      const nucleus = registeredNuclei.get(nucleusId);
      if (nucleus && payload?.state) {
        isTimeTraveling = true;
        nucleus.set(payload.state, true);
        isTimeTraveling = false;
      }
    }
    
    if (type === 'SYNAPSE_DEVTOOLS_RESET' && nucleusId) {
      const nucleus = registeredNuclei.get(nucleusId);
      if (nucleus) {
        isTimeTraveling = true;
        nucleus.reset();
        isTimeTraveling = false;
      }
    }
    
    // Handle live edit from DevTools
    if (type === 'SYNAPSE_DEVTOOLS_UPDATE') {
      const { nucleusName, path, value } = event.data;
      const nucleus = Array.from(registeredNuclei.entries())
        .find(([, n]) => {
          const devtools = (window as any)[DEVTOOLS_KEY];
          const entry = Object.entries(devtools?.nuclei || {})
            .find(([id]) => devtools.nuclei[id].name === nucleusName);
          return !!entry;
        })?.[1];
      
      if (nucleus) {
        isTimeTraveling = true;
        
        if (!path || path === nucleusName) {
          // Replace entire state
          nucleus.set(value, true);
        } else {
          // Update specific path
          const current = nucleus.get();
          const updated = setNestedValue({ ...current }, path, value);
          nucleus.set(updated as Partial<object>, true);
        }
        
        isTimeTraveling = false;
      }
    }
  });
  
  connection.isConnected = true;
}

/**
 * Set a nested value in an object
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  
  current[parts[parts.length - 1]] = value;
  return obj;
}

/**
 * Connect a nucleus to DevTools
 */
export function connectDevTools<T extends object>(
  nucleus: Nucleus<T>,
  name: string
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  // Initialize on first connect
  if (!connection.isConnected) {
    initDevTools();
  }
  
  const id = name; // Use just the name as ID
  
  // Cancel any pending cleanup (for StrictMode re-mount)
  const pendingCleanup = cleanupTimers.get(id);
  if (pendingCleanup) {
    clearTimeout(pendingCleanup);
    cleanupTimers.delete(id);
  }
  
  // If already registered, update the reference but don't re-init
  if (registeredNuclei.has(id)) {
    registeredNuclei.set(id, nucleus as Nucleus<object>);
    return createCleanup(id);
  }
  
  registeredNuclei.set(id, nucleus as Nucleus<object>);
  
  const devtools = (window as Window & { [DEVTOOLS_KEY]?: DevToolsState })[DEVTOOLS_KEY];
  if (!devtools) return () => {};
  
  // Get action names from state
  const actions = getActionNames(nucleus.get());
  
  // Initialize nucleus in DevTools (serialize to remove functions)
  const initialState = serializeState(nucleus.get());
  devtools.nuclei[id] = {
    name,
    state: initialState,
    actions,
    history: [{
      state: initialState,
      action: DEVTOOLS_MESSAGES.INIT,
      timestamp: Date.now(),
    }],
  };
  
  // Send init message
  sendMessage({
    type: 'INIT',
    payload: {
      name,
      state: initialState,
    },
    timestamp: Date.now(),
    nucleusId: id,
  });
  
  // Subscribe to changes
  const unsubscribe = nucleus.subscribe((state, prevState) => {
    if (!devtools.nuclei[id]) return;
    
    // Skip history if time-traveling
    if (isTimeTraveling) {
      devtools.nuclei[id].state = serializeState(state);
      return;
    }
    
    // Serialize state to remove functions
    const serializedState = serializeState(state);
    const serializedPrevState = serializeState(prevState);
    
    // Get the action name that was set before the state change
    const actionName = getAndClearAction();
    
    // Update DevTools state
    devtools.nuclei[id].state = serializedState;
    
    // Add to history (limit size)
    devtools.nuclei[id].history.push({
      state: serializedState,
      action: actionName,
      timestamp: Date.now(),
    });
    
    if (devtools.nuclei[id].history.length > NUMBERS.MAX_HISTORY) {
      devtools.nuclei[id].history.shift();
    }
    
    // Send change message
    sendMessage({
      type: 'STATE_CHANGE',
      payload: {
        prevState: serializedPrevState,
        nextState: serializedState,
        action: actionName,
      },
      timestamp: Date.now(),
      nucleusId: id,
    });
  });
  
  // Return cleanup function
  return createCleanup(id, unsubscribe);
}

/**
 * Create a cleanup function with delayed execution for StrictMode
 */
function createCleanup(id: string, unsubscribe?: () => void): () => void {
  return () => {
    // Delay cleanup to allow StrictMode re-mount
    const timer = setTimeout(() => {
      cleanupTimers.delete(id);
      if (unsubscribe) unsubscribe();
      registeredNuclei.delete(id);
      
      const devtools = (window as Window & { [DEVTOOLS_KEY]?: DevToolsState })[DEVTOOLS_KEY];
      if (devtools?.nuclei[id]) {
        delete devtools.nuclei[id];
      }
    }, 100);
    
    cleanupTimers.set(id, timer);
  };
}

/**
 * Send message to DevTools
 */
function sendMessage(message: DevToolsMessage): void {
  if (typeof window === 'undefined') return;
  
  connection.history.push(message);
  
  // Dispatch event for extension
  window.postMessage({
    source: 'synapse-devtools',
    ...message,
  }, '*');
}

/**
 * Get all registered nuclei (for DevTools)
 */
export function getRegisteredNuclei(): Map<string, Nucleus<object>> {
  return registeredNuclei;
}

/**
 * Export state for debugging
 */
export function exportState(): Record<string, unknown> {
  const state: Record<string, unknown> = {};
  registeredNuclei.forEach((nucleus, id) => {
    state[id] = serializeState(nucleus.get());
  });
  return state;
}

/**
 * Import state (for debugging/testing)
 */
export function importState(state: Record<string, unknown>): void {
  Object.entries(state).forEach(([id, nucleusState]) => {
    const nucleus = registeredNuclei.get(id);
    if (nucleus && nucleusState) {
      nucleus.set(nucleusState as Partial<object>, true);
    }
  });
}

