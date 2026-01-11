/**
 * Synapse DevTools - Page Injection Script
 * Runs in the page context to access Synapse store
 */

interface SynapseStore {
  getState: () => unknown;
  dispatch: (action: unknown) => unknown;
}

interface SynapseDevTools {
  isConnected: boolean;
  store: SynapseStore | null;
  actions: unknown[];
  connect: (options: SynapseStore) => void;
  disconnect: () => void;
  send: (action: unknown, state: unknown) => void;
  getState: () => unknown;
  dispatch: (action: unknown) => unknown;
}

declare global {
  interface Window {
    __SYNAPSE_DEVTOOLS_INJECTED__?: boolean;
    __SYNAPSE_DEVTOOLS__?: SynapseDevTools;
  }
}

export {};

(function() {
  // Check if already injected
  if (window.__SYNAPSE_DEVTOOLS_INJECTED__) return;
  window.__SYNAPSE_DEVTOOLS_INJECTED__ = true;

  // DevTools interface
  window.__SYNAPSE_DEVTOOLS__ = {
    isConnected: false,
    store: null,
    actions: [],

    /**
     * Connect to a Synapse store
     */
    connect: function(options: SynapseStore) {
      this.store = options;
      this.isConnected = true;

      // Notify DevTools panel
      window.postMessage({
        type: 'SYNAPSE_CONNECTED',
        payload: { timestamp: Date.now() }
      }, '*');

      // Send initial state
      if (options.getState) {
        window.postMessage({
          type: 'SYNAPSE_STATE',
          payload: options.getState()
        }, '*');
      }

      console.log('[Synapse DevTools] Connected to store');
    },

    /**
     * Disconnect from store
     */
    disconnect: function() {
      this.store = null;
      this.isConnected = false;
      this.actions = [];

      window.postMessage({
        type: 'SYNAPSE_DISCONNECTED',
        payload: { timestamp: Date.now() }
      }, '*');

      console.log('[Synapse DevTools] Disconnected from store');
    },

    /**
     * Send action to DevTools
     */
    send: function(action: unknown, state: unknown) {
      if (!this.isConnected) return;

      const enrichedAction = {
        ...action as object,
        timestamp: Date.now(),
        state: state
      };

      this.actions.push(enrichedAction);

      window.postMessage({
        type: 'SYNAPSE_ACTION',
        payload: enrichedAction
      }, '*');
    },

    /**
     * Get current state
     */
    getState: function() {
      if (this.store && this.store.getState) {
        return this.store.getState();
      }
      return null;
    },

    /**
     * Dispatch action
     */
    dispatch: function(action: unknown) {
      if (this.store && this.store.dispatch) {
        return this.store.dispatch(action);
      }
      return null;
    }
  };

  // Listen for messages from DevTools panel
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || !event.data.type) return;

    const devTools = window.__SYNAPSE_DEVTOOLS__;

    switch (event.data.type) {
      case 'SYNAPSE_GET_STATE':
        if (devTools?.isConnected && devTools.store) {
          window.postMessage({
            type: 'SYNAPSE_STATE',
            payload: devTools.store.getState()
          }, '*');
        }
        break;

      case 'SYNAPSE_DISPATCH':
        if (devTools?.isConnected && devTools.store) {
          devTools.store.dispatch(event.data.payload);
        }
        break;

      case 'SYNAPSE_EXECUTE_API':
        if (devTools?.isConnected && devTools.store) {
          const { method, url, actionType, data } = event.data.payload;

          devTools.store.dispatch({
            type: actionType,
            payload: { url, method, data },
            meta: { api: true, timestamp: Date.now() }
          });
        }
        break;

      case 'SYNAPSE_JUMP_TO_STATE':
        // Time travel - restore to specific state
        console.log('[Synapse DevTools] Jump to state not implemented yet');
        break;
    }
  });

  console.log('[Synapse DevTools] Injection script loaded');
})();

