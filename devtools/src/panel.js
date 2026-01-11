/**
 * Synapse DevTools - Panel Script
 * Main panel functionality
 */

interface Action {
  type: string;
  payload?: unknown;
  timestamp?: number;
  state?: unknown;
  [key: string]: unknown;
}

interface Message {
  type: string;
  payload?: unknown;
}

(function() {
  // State
  let actions: Action[] = [];
  let currentState: unknown = null;
  let selectedActionIndex = -1;
  let isConnected = false;

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab') as NodeListOf<HTMLButtonElement>;
  const panels = document.querySelectorAll('.panel') as NodeListOf<HTMLDivElement>;
  const actionsList = document.getElementById('actions-list') as HTMLDivElement;
  const actionDetail = document.getElementById('action-detail') as HTMLDivElement;
  const stateTree = document.getElementById('state-tree') as HTMLDivElement;
  const diffView = document.getElementById('diff-view') as HTMLDivElement;
  const connectionStatus = document.getElementById('connection-status') as HTMLDivElement;
  const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement;
  const apiExecuteBtn = document.getElementById('api-execute') as HTMLButtonElement;

  // Initialize
  function init() {
    setupTabs();
    setupEventListeners();
    connectToPage();
  }

  // Setup tab switching
  function setupTabs() {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update active tab
        tabButtons.forEach(b => b.classList.remove('active'));
        button.classList.add('active');
        
        // Update active panel
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById(`${tabName}-panel`).classList.add('active');
      });
    });
  }

  // Setup event listeners
  function setupEventListeners() {
    clearBtn.addEventListener('click', clearActions);
    apiExecuteBtn.addEventListener('click', executeApiAction);
  }

  // Connect to page
  function connectToPage(): void {
    // Listen for messages from content script
    const port = chrome.runtime.connect({ name: 'synapse-panel' });

    port.onMessage.addListener((message: Message) => {
      switch (message.type) {
        case 'SYNAPSE_CONNECTED':
          setConnected(true);
          break;
        case 'SYNAPSE_DISCONNECTED':
          setConnected(false);
          break;
        case 'SYNAPSE_ACTION':
          addAction(message.payload as Action);
          break;
        case 'SYNAPSE_STATE':
          updateState(message.payload);
          break;
      }
    });

    // Request initial state
    port.postMessage({ type: 'SYNAPSE_GET_STATE' });
  }

  // Set connection status
  function setConnected(connected) {
    isConnected = connected;
    const statusDot = connectionStatus.querySelector('.status-dot');
    const statusText = connectionStatus.childNodes[1];
    
    if (connected) {
      statusDot.classList.remove('disconnected');
      statusDot.classList.add('connected');
      connectionStatus.innerHTML = '<span class="status-dot connected"></span> Connected';
    } else {
      statusDot.classList.remove('connected');
      statusDot.classList.add('disconnected');
      connectionStatus.innerHTML = '<span class="status-dot disconnected"></span> Disconnected';
    }
  }

  // Add action to list
  function addAction(action: Action): void {
    actions.push(action);
    renderActions();
  }

  // Clear actions
  function clearActions() {
    actions = [];
    selectedActionIndex = -1;
    renderActions();
    renderActionDetail(null);
  }

  // Render actions list
  function renderActions() {
    if (actions.length === 0) {
      actionsList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 128 128" width="48" height="48">
            <circle cx="64" cy="64" r="60" fill="none" stroke="#3B3B5C" stroke-width="2"/>
            <circle cx="64" cy="64" r="12" fill="#3B3B5C"/>
          </svg>
          <p>No actions recorded yet.</p>
          <p class="hint">Actions will appear here when dispatched.</p>
        </div>
      `;
      return;
    }

    actionsList.innerHTML = actions.map((action, index) => `
      <div class="action-item ${index === selectedActionIndex ? 'selected' : ''}" 
           data-index="${index}">
        <span class="action-type">${action.type}</span>
        <span class="action-time">${formatTime(action.timestamp)}</span>
      </div>
    `).join('');

    // Add click handlers
    actionsList.querySelectorAll('.action-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedActionIndex = parseInt(item.dataset.index);
        renderActions();
        renderActionDetail(actions[selectedActionIndex]);
        renderDiff(selectedActionIndex);
      });
    });
  }

  // Render action detail
  function renderActionDetail(action) {
    if (!action) {
      actionDetail.innerHTML = `
        <div class="empty-state">
          <p>Select an action to view details</p>
        </div>
      `;
      return;
    }

    actionDetail.innerHTML = `
      <div class="json-viewer">
        ${renderJSON(action)}
      </div>
    `;
  }

  // Update current state
  function updateState(state: unknown): void {
    currentState = state;
    renderState();
  }

  // Render state tree
  function renderState() {
    if (!currentState) {
      stateTree.innerHTML = `
        <div class="empty-state">
          <p>No state available</p>
        </div>
      `;
      return;
    }

    stateTree.innerHTML = `
      <div class="json-viewer">
        ${renderJSON(currentState)}
      </div>
    `;
  }

  // Render diff
  function renderDiff(actionIndex) {
    if (actionIndex < 0 || !actions[actionIndex]) {
      diffView.innerHTML = `
        <div class="empty-state">
          <p>Select an action to view state diff</p>
        </div>
      `;
      return;
    }

    const action = actions[actionIndex];
    const prevState = actionIndex > 0 ? actions[actionIndex - 1].state : {};
    const nextState = action.state || {};

    const diff = computeDiff(prevState, nextState);
    
    if (Object.keys(diff).length === 0) {
      diffView.innerHTML = `
        <div class="empty-state">
          <p>No state changes</p>
        </div>
      `;
      return;
    }

    diffView.innerHTML = `
      <div class="json-viewer">
        ${renderDiffJSON(diff)}
      </div>
    `;
  }

  // Compute diff between two states
  function computeDiff(prev: unknown, next: unknown, path = ''): Record<string, { prev: unknown; next: unknown }> {
    const diff: Record<string, { prev: unknown; next: unknown }> = {};

    const allKeys = new Set([
      ...Object.keys((prev as object) || {}),
      ...Object.keys((next as object) || {})
    ]);

    for (const key of allKeys) {
      const fullPath = path ? `${path}.${key}` : key;
      const prevObj = prev as Record<string, unknown>;
      const nextObj = next as Record<string, unknown>;
      const prevVal = prevObj ? prevObj[key] : undefined;
      const nextVal = nextObj ? nextObj[key] : undefined;

      if (prevVal !== nextVal) {
        if (typeof prevVal === 'object' && typeof nextVal === 'object' &&
            prevVal !== null && nextVal !== null) {
          Object.assign(diff, computeDiff(prevVal, nextVal, fullPath));
        } else {
          diff[fullPath] = { prev: prevVal, next: nextVal };
        }
      }
    }

    return diff;
  }

  // Render JSON object
  function renderJSON(obj: unknown, indent = 0): string {
    if (obj === null) return '<span class="json-null">null</span>';
    if (obj === undefined) return '<span class="json-null">undefined</span>';

    const type = typeof obj;

    if (type === 'string') {
      return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
    }
    if (type === 'number') {
      return `<span class="json-number">${obj}</span>`;
    }
    if (type === 'boolean') {
      return `<span class="json-boolean">${obj}</span>`;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';

      const items = obj.map((item, i) =>
        `${'  '.repeat(indent + 1)}${renderJSON(item, indent + 1)}`
      ).join(',\n');

      return `[\n${items}\n${'  '.repeat(indent)}]`;
    }

    if (type === 'object') {
      const keys = Object.keys(obj as object);
      if (keys.length === 0) return '{}';

      const objRecord = obj as Record<string, unknown>;
      const items = keys.map(key =>
        `${'  '.repeat(indent + 1)}<span class="json-key">"${escapeHtml(key)}"</span>: ${renderJSON(objRecord[key], indent + 1)}`
      ).join(',\n');

      return `{\n${items}\n${'  '.repeat(indent)}}`;
    }

    return String(obj);
  }

  // Render diff JSON
  function renderDiffJSON(diff: Record<string, { prev: unknown; next: unknown }>): string {
    return Object.entries(diff).map(([path, { prev, next }]) => {
      return `
        <div>
          <span class="json-key">${path}</span>:
          <div class="diff-removed">- ${renderJSON(prev)}</div>
          <div class="diff-added">+ ${renderJSON(next)}</div>
        </div>
      `;
    }).join('\n');
  }

  // Execute API action
  function executeApiAction() {
    const method = document.getElementById('api-method').value;
    const url = document.getElementById('api-url').value;
    const actionType = document.getElementById('api-action-type').value;
    const bodyText = document.getElementById('api-body').value;
    
    let body;
    try {
      body = bodyText ? JSON.parse(bodyText) : undefined;
    } catch (e) {
      alert('Invalid JSON in body');
      return;
    }
    
    // Send to page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'SYNAPSE_EXECUTE_API',
        payload: {
          method,
          url,
          actionType: actionType || `API_${method}`,
          data: body
        }
      });
    });
  }

  // Helper functions
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Start
  init();
})();

