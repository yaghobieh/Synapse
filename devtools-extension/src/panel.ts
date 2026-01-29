// Constants
const PANEL_DEFAULTS = {
  POLL_INTERVAL: 250,
  PERF_UPDATE_INTERVAL: 1000,
  MAX_ACTIONS: 200,
  MAX_SNAPSHOTS: 10,
  MAX_UPDATE_TIMES: 100,
  MAX_PERF_BARS: 50,
};

const MESSAGES = {
  WAITING: 'Waiting...',
  NO_STATE: 'No state',
  SELECT_ACTION: 'Select an action to see what changed',
  NO_CHANGES: 'No changes detected',
  INVALID_JSON: 'Invalid JSON',
  NO_SNAPSHOTS: 'No snapshots yet',
};

// Icons
const ICONS = {
  LOGO: `<svg viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="11" r="8" fill="#66d9ef"/>
    <ellipse cx="12" cy="10" rx="2" ry="2.5" fill="white"/>
    <ellipse cx="20" cy="10" rx="2" ry="2.5" fill="white"/>
    <circle cx="12.5" cy="10.5" r="1" fill="#2f3129"/>
    <circle cx="20.5" cy="10.5" r="1" fill="#2f3129"/>
    <rect x="10" y="16" width="12" height="8" rx="2" fill="#a6e22e"/>
    <path d="M6 19c-2 3-2 6 0 8" stroke="#4a9eb8" stroke-width="2" stroke-linecap="round"/>
    <path d="M9 20c-1 2-1 5 0 7" stroke="#4a9eb8" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 19c2 3 2 6 0 8" stroke="#4a9eb8" stroke-width="2" stroke-linecap="round"/>
    <path d="M23 20c1 2 1 5 0 7" stroke="#4a9eb8" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  SNAPSHOT: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="16" height="16" rx="2"/><circle cx="10" cy="10" r="4"/><path d="M2 7h2"/></svg>`,
  EXPORT: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 12v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="6 8 10 12 14 8"/><line x1="10" y1="12" x2="10" y2="2"/></svg>`,
  IMPORT: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 12v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="14 6 10 2 6 6"/><line x1="10" y1="2" x2="10" y2="12"/></svg>`,
  CLEAR: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 5 5 5 17 5"/><path d="M15 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5"/><path d="M8 5V3h4v2"/></svg>`,
  ACTION: `<svg viewBox="0 0 20 20" fill="currentColor"><polygon points="6 4 16 10 6 16"/></svg>`,
  REWIND: `<svg viewBox="0 0 20 20" fill="currentColor"><polygon points="9 15 2 10 9 5"/><polygon points="17 15 10 10 17 5"/></svg>`,
  EXPAND: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="5 8 10 13 15 8"/></svg>`,
  COLLAPSE: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="15 12 10 7 5 12"/></svg>`,
  INIT: `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10" cy="10" r="7"/><text x="10" y="14" text-anchor="middle" font-size="10" fill="currentColor">@</text></svg>`,
};

interface ActionEntry {
  id: number;
  store: string;
  action: string;
  state: Record<string, unknown>;
  prevState: Record<string, unknown>;
  timestamp: number;
}

interface Snapshot {
  id: number;
  name: string;
  state: Record<string, Record<string, unknown>>;
  timestamp: number;
}

// State
let allStores: Record<string, Record<string, unknown>> = {};
let actions: ActionEntry[] = [];
let snapshots: Snapshot[] = [];
let selectedActionId: number | null = null;
let currentActionIndex = -1;
let expanded = new Set<string>();
let searchQuery = '';
let nextId = 0;
let snapshotId = 0;
let updateCount = 0;
let updateTimes: number[] = [];
let lastUpdateTime = Date.now();
let editingStore = '';
let editingKey = '';

// DOM refs
let actionsListEl: HTMLElement;
let actionCountEl: HTMLElement;
let snapshotsListEl: HTMLElement;
let diffTabEl: HTMLElement;
let stateTabEl: HTMLElement;
let actionTabEl: HTMLElement;
let perfTabEl: HTMLElement;
let statusTextEl: HTMLElement;
let perfStatsEl: HTMLElement;
let searchInputEl: HTMLInputElement;
let editModalEl: HTMLElement;
let editPathEl: HTMLElement;
let editValueEl: HTMLTextAreaElement;
let importModalEl: HTMLElement;
let importValueEl: HTMLTextAreaElement;

function init(): void {
  actionsListEl = document.getElementById('actions-list')!;
  actionCountEl = document.getElementById('action-count')!;
  snapshotsListEl = document.getElementById('snapshots-list')!;
  diffTabEl = document.getElementById('diff-tab')!;
  stateTabEl = document.getElementById('state-tab')!;
  actionTabEl = document.getElementById('action-tab')!;
  perfTabEl = document.getElementById('perf-tab')!;
  statusTextEl = document.getElementById('status-text')!;
  perfStatsEl = document.getElementById('perf-stats')!;
  searchInputEl = document.getElementById('search-input') as HTMLInputElement;
  editModalEl = document.getElementById('edit-modal')!;
  editPathEl = document.getElementById('edit-path')!;
  editValueEl = document.getElementById('edit-value') as HTMLTextAreaElement;
  importModalEl = document.getElementById('import-modal')!;
  importValueEl = document.getElementById('import-value') as HTMLTextAreaElement;

  const logoEl = document.getElementById('logo-container');
  if (logoEl) {
    logoEl.innerHTML = `<span class="logo-icon">${ICONS.LOGO}</span><span class="logo-text">Synapse</span>`;
  }

  const snapshotBtn = document.getElementById('snapshot-btn');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const clearBtn = document.getElementById('clear-btn');

  if (snapshotBtn) snapshotBtn.innerHTML = ICONS.SNAPSHOT;
  if (exportBtn) exportBtn.innerHTML = ICONS.EXPORT;
  if (importBtn) importBtn.innerHTML = ICONS.IMPORT;
  if (clearBtn) clearBtn.innerHTML = ICONS.CLEAR;

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab((tab as HTMLElement).dataset.tab!));
  });

  searchInputEl?.addEventListener('input', () => {
    searchQuery = searchInputEl.value.toLowerCase();
    renderState();
  });

  snapshotBtn?.addEventListener('click', saveSnapshot);
  exportBtn?.addEventListener('click', exportState);
  importBtn?.addEventListener('click', () => importModalEl?.classList.remove('hidden'));
  clearBtn?.addEventListener('click', clearAll);

  document.getElementById('close-modal')?.addEventListener('click', closeEditModal);
  document.getElementById('cancel-edit')?.addEventListener('click', closeEditModal);
  document.getElementById('save-edit')?.addEventListener('click', saveEdit);
  document.getElementById('close-import')?.addEventListener('click', () => importModalEl?.classList.add('hidden'));
  document.getElementById('cancel-import')?.addEventListener('click', () => importModalEl?.classList.add('hidden'));
  document.getElementById('do-import')?.addEventListener('click', doImport);

  poll();
  setInterval(poll, PANEL_DEFAULTS.POLL_INTERVAL);
  setInterval(updatePerfStats, PANEL_DEFAULTS.PERF_UPDATE_INTERVAL);
}

function poll(): void {
  try {
    (chrome as any).devtools.inspectedWindow.eval(
      'window.__SYNAPSE_DEVTOOLS__',
      (result: any, error: any) => {
        if (error || !result?.nuclei) return;

        Object.entries(result.nuclei).forEach(([_id, nucleus]: [string, any]) => {
          const name = nucleus.name;
          const state = cleanState(nucleus.state || {});
          const prev = allStores[name];

          if (prev && JSON.stringify(prev) !== JSON.stringify(state)) {
            const lastHist = nucleus.history?.[nucleus.history.length - 1];

            actions.unshift({
              id: ++nextId,
              store: name,
              action: lastHist?.action || 'SET',
              state: JSON.parse(JSON.stringify(state)),
              prevState: JSON.parse(JSON.stringify(prev)),
              timestamp: Date.now(),
            });

            updateCount++;
            updateTimes.push(Date.now() - lastUpdateTime);
            lastUpdateTime = Date.now();
            if (updateTimes.length > PANEL_DEFAULTS.MAX_UPDATE_TIMES) updateTimes.shift();
            if (actions.length > PANEL_DEFAULTS.MAX_ACTIONS) actions.pop();
            currentActionIndex = 0;
          }

          allStores[name] = state;
        });

        render();
      }
    );
  } catch (e) {
    console.error('Synapse DevTools poll error:', e);
  }
}

function cleanState(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return {};
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'function') continue;
    if (typeof val === 'string' && val.includes('[Function')) continue;

    if (Array.isArray(val)) {
      result[key] = val.filter(v => typeof v !== 'function');
    } else if (val && typeof val === 'object') {
      result[key] = cleanState(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

function render(): void {
  renderActions();
  renderDiff();
  renderState();
  renderAction();
  renderPerf();
  renderSnapshots();
  updateStatus();
}

function renderActions(): void {
  if (!actionsListEl || !actionCountEl) return;

  actionCountEl.textContent = String(actions.length);
  const storeNames = Object.keys(allStores);

  if (storeNames.length === 0) {
    actionsListEl.innerHTML = `<div class="empty"><div class="empty-icon">${ICONS.LOGO}</div>${MESSAGES.WAITING}</div>`;
    return;
  }

  let html = '';

  actions.forEach((a, idx) => {
    const isCurrent = idx === currentActionIndex;
    const isSelected = a.id === selectedActionId;
    const time = new Date(a.timestamp).toLocaleTimeString();

    html += `<div class="action-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}" data-id="${a.id}" data-idx="${idx}">
      <span class="action-type set">${ICONS.ACTION}</span>
      <span class="action-name">${a.action}</span>
      <span class="action-store">${a.store}</span>
      <span class="action-time">${time}</span>
      <span class="action-jump" data-jump="${idx}" title="Jump">${ICONS.REWIND}</span>
    </div>`;
  });

  storeNames.forEach(name => {
    html += `<div class="action-item" data-init="${name}">
      <span class="action-type init">${ICONS.INIT}</span>
      <span class="action-name">INIT</span>
      <span class="action-store">${name}</span>
    </div>`;
  });

  actionsListEl.innerHTML = html;

  actionsListEl.querySelectorAll('.action-item[data-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('action-jump')) return;
      const id = parseInt((el as HTMLElement).dataset.id!, 10);
      selectedActionId = id;
      render();
    });
  });

  actionsListEl.querySelectorAll('.action-jump').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt((el as HTMLElement).dataset.jump!, 10);
      timeTravel(idx);
    });
  });
}

function renderDiff(): void {
  if (!diffTabEl) return;

  const action = actions.find(a => a.id === selectedActionId);

  if (!action) {
    diffTabEl.innerHTML = `<div class="empty">${MESSAGES.SELECT_ACTION}</div>`;
    return;
  }

  const { action: actionName, store, prevState, state, timestamp } = action;
  const time = new Date(timestamp).toLocaleString();
  const actionIdx = actions.findIndex(a => a.id === selectedActionId);

  let html = `
    <div class="diff-header">
      <div class="diff-action-name">${actionName}</div>
      <div class="diff-meta">
        <div>Store: <span>${store}</span></div>
        <div>Time: <span>${time}</span></div>
      </div>
      <div class="diff-buttons">
        <button class="diff-btn jump" data-jump="${actionIdx}">${ICONS.REWIND} Jump</button>
      </div>
    </div>
    <div class="changes-section">
      <div class="changes-title">Changes</div>
  `;

  const allKeys = new Set([...Object.keys(prevState), ...Object.keys(state)]);
  let hasChanges = false;

  allKeys.forEach(key => {
    const before = prevState[key];
    const after = state[key];

    if (JSON.stringify(before) !== JSON.stringify(after)) {
      hasChanges = true;
      html += `
        <div class="change-item">
          <div class="change-key">${key}</div>
          <div class="change-values">
            <div class="change-row before"><span class="change-sign">−</span><span class="change-value">${formatJson(before)}</span></div>
            <div class="change-row after"><span class="change-sign">+</span><span class="change-value">${formatJson(after)}</span></div>
          </div>
        </div>
      `;
    }
  });

  if (!hasChanges) {
    html += `<div class="empty">${MESSAGES.NO_CHANGES}</div>`;
  }

  html += '</div>';
  diffTabEl.innerHTML = html;

  diffTabEl.querySelectorAll('.diff-btn.jump').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt((el as HTMLElement).dataset.jump!, 10);
      timeTravel(idx);
    });
  });
}

function renderState(): void {
  if (!stateTabEl) return;

  const storeNames = Object.keys(allStores);

  if (storeNames.length === 0) {
    stateTabEl.innerHTML = `<div class="empty">${MESSAGES.NO_STATE}</div>`;
    return;
  }

  let html = '';
  storeNames.forEach(storeName => {
    html += renderTree(storeName, allStores[storeName], storeName);
  });

  stateTabEl.innerHTML = html;
  attachTreeEvents();
}

function renderTree(key: string, value: unknown, path: string, depth = 0): string {
  const isObj = value !== null && typeof value === 'object';
  const isExp = expanded.has(path);
  const indent = depth * 16;

  if (searchQuery && !matchesSearch(key, value)) return '';

  let html = `<div class="tree-node" style="padding-left:${indent}px">`;

  if (isObj) {
    const count = Array.isArray(value) ? value.length : Object.keys(value as object).length;
    const bracket = Array.isArray(value) ? `[${count}]` : `{${count}}`;

    html += `<div class="tree-row" data-path="${path}">
      <span class="tree-toggle">${isExp ? ICONS.EXPAND : ICONS.COLLAPSE}</span>
      <span class="tree-key">${key}</span>
      <span class="tree-colon">:</span>
      <span class="tree-bracket">${bracket}</span>
    </div>`;

    if (isExp) {
      html += '<div class="tree-children">';
      const entries = Array.isArray(value)
        ? value.map((v, i) => [String(i), v] as [string, unknown])
        : Object.entries(value as object);

      entries.forEach(([k, v]) => {
        html += renderTree(k, v, `${path}.${k}`, depth + 1);
      });
      html += '</div>';
    }
  } else {
    const [store, ...rest] = path.split('.');
    const keyPath = rest.join('.');

    html += `<div class="tree-row editable" data-path="${path}" data-store="${store}" data-key="${keyPath}">
      <span class="tree-toggle"></span>
      <span class="tree-key">${key}</span>
      <span class="tree-colon">:</span>
      ${renderValue(value)}
    </div>`;
  }

  html += '</div>';
  return html;
}

function matchesSearch(key: string, value: unknown): boolean {
  if (key.toLowerCase().includes(searchQuery)) return true;
  if (typeof value === 'string' && value.toLowerCase().includes(searchQuery)) return true;
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).some(([k, v]) => matchesSearch(k, v));
  }
  return false;
}

function renderValue(value: unknown): string {
  if (value === null) return '<span class="tree-null">null</span>';
  if (value === undefined) return '<span class="tree-null">undefined</span>';
  if (typeof value === 'string') return `<span class="tree-string">"${escapeHtml(value)}"</span>`;
  if (typeof value === 'number') return `<span class="tree-number">${value}</span>`;
  if (typeof value === 'boolean') return `<span class="tree-boolean">${value}</span>`;
  return String(value);
}

function attachTreeEvents(): void {
  stateTabEl?.querySelectorAll('.tree-row').forEach(el => {
    el.addEventListener('click', () => {
      const path = (el as HTMLElement).dataset.path!;

      if (el.classList.contains('editable')) {
        openEditModal((el as HTMLElement).dataset.store!, (el as HTMLElement).dataset.key!);
        return;
      }

      if (expanded.has(path)) expanded.delete(path);
      else expanded.add(path);
      renderState();
    });
  });
}

function renderAction(): void {
  if (!actionTabEl) return;

  const action = actions.find(a => a.id === selectedActionId);

  if (!action) {
    actionTabEl.innerHTML = `<div class="empty">${MESSAGES.SELECT_ACTION}</div>`;
    return;
  }

  actionTabEl.innerHTML = `
    <h3 style="color:var(--accent);margin-bottom:16px">Action Payload</h3>
    <pre style="background:var(--bg-dark);padding:12px;border-radius:6px;overflow:auto">${formatJson(action)}</pre>
  `;
}

function renderPerf(): void {
  if (!perfTabEl) return;

  const avgTime = updateTimes.length > 0
    ? (updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length).toFixed(0)
    : '0';

  const storeCount = Object.keys(allStores).length;
  const stateSize = JSON.stringify(allStores).length;
  const recentTimes = updateTimes.slice(-PANEL_DEFAULTS.MAX_PERF_BARS);
  const maxTime = Math.max(...recentTimes, 100);

  const barsHtml = recentTimes.map(t =>
    `<div class="perf-bar" style="height:${Math.max(4, (t / maxTime) * 100)}%"></div>`
  ).join('');

  perfTabEl.innerHTML = `
    <div class="perf-grid">
      <div class="perf-card"><div class="perf-value">${updateCount}</div><div class="perf-label">Total Updates</div></div>
      <div class="perf-card"><div class="perf-value">${avgTime}ms</div><div class="perf-label">Avg Time</div></div>
      <div class="perf-card"><div class="perf-value">${storeCount}</div><div class="perf-label">Stores</div></div>
      <div class="perf-card"><div class="perf-value">${formatSize(stateSize)}</div><div class="perf-label">State Size</div></div>
    </div>
    <div class="perf-chart">
      <div class="perf-chart-title">Update Frequency</div>
      <div class="perf-bars">${barsHtml || '<div class="empty">No updates yet</div>'}</div>
    </div>
  `;
}

function renderSnapshots(): void {
  if (!snapshotsListEl) return;

  if (snapshots.length === 0) {
    snapshotsListEl.innerHTML = `<div style="padding:8px;color:var(--text-dim);font-size:10px">${MESSAGES.NO_SNAPSHOTS}</div>`;
    return;
  }

  snapshotsListEl.innerHTML = snapshots.map(s => `
    <div class="snapshot-item" data-id="${s.id}">
      <span class="snapshot-name">${s.name}</span>
      <span class="snapshot-time">${new Date(s.timestamp).toLocaleTimeString()}</span>
    </div>
  `).join('');

  snapshotsListEl.querySelectorAll('.snapshot-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt((el as HTMLElement).dataset.id!, 10);
      restoreSnapshot(id);
    });
  });
}

function timeTravel(actionIdx: number): void {
  if (actionIdx < 0 || actionIdx >= actions.length) return;

  const action = actions[actionIdx];
  const { store, state } = action;

  const code = `window.postMessage({type:'SYNAPSE_DEVTOOLS_UPDATE',nucleusName:'${store}',path:'',value:${JSON.stringify(state)}},'*');`;
  (chrome as any).devtools.inspectedWindow.eval(code);

  currentActionIndex = actionIdx;
  allStores[store] = state;
  render();
}

function saveSnapshot(): void {
  const name = `Snapshot ${++snapshotId}`;
  snapshots.unshift({ id: snapshotId, name, state: JSON.parse(JSON.stringify(allStores)), timestamp: Date.now() });
  if (snapshots.length > PANEL_DEFAULTS.MAX_SNAPSHOTS) snapshots.pop();
  renderSnapshots();
}

function restoreSnapshot(id: number): void {
  const snapshot = snapshots.find(s => s.id === id);
  if (!snapshot) return;

  Object.entries(snapshot.state).forEach(([store, state]) => {
    const code = `window.postMessage({type:'SYNAPSE_DEVTOOLS_UPDATE',nucleusName:'${store}',path:'',value:${JSON.stringify(state)}},'*');`;
    (chrome as any).devtools.inspectedWindow.eval(code);
    allStores[store] = state as Record<string, unknown>;
  });

  render();
}

function exportState(): void {
  const data = JSON.stringify({ stores: allStores, actions }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `synapse-state-${Date.now()}.json`;
  a.click();
}

function doImport(): void {
  try {
    const data = JSON.parse(importValueEl.value);
    if (data.stores) {
      Object.entries(data.stores).forEach(([store, state]) => {
        const code = `window.postMessage({type:'SYNAPSE_DEVTOOLS_UPDATE',nucleusName:'${store}',path:'',value:${JSON.stringify(state)}},'*');`;
        (chrome as any).devtools.inspectedWindow.eval(code);
        allStores[store] = state as Record<string, unknown>;
      });
    }
    importModalEl?.classList.add('hidden');
    importValueEl.value = '';
    render();
  } catch (_e) {
    alert(MESSAGES.INVALID_JSON);
  }
}

function openEditModal(store: string, key: string): void {
  editingStore = store;
  editingKey = key;
  const value = getNestedValue(allStores[store], key);
  if (editPathEl) editPathEl.textContent = `${store}.${key}`;
  if (editValueEl) editValueEl.value = JSON.stringify(value, null, 2);
  editModalEl?.classList.remove('hidden');
}

function closeEditModal(): void {
  editModalEl?.classList.add('hidden');
}

function saveEdit(): void {
  if (!editingStore) return;
  try {
    const newValue = JSON.parse(editValueEl.value);
    const code = `window.postMessage({type:'SYNAPSE_DEVTOOLS_UPDATE',nucleusName:'${editingStore}',path:'${editingKey}',value:${JSON.stringify(newValue)}},'*');`;
    (chrome as any).devtools.inspectedWindow.eval(code);
    setNestedValue(allStores[editingStore], editingKey, newValue);
    closeEditModal();
    render();
  } catch (_e) {
    alert(MESSAGES.INVALID_JSON);
  }
}

function switchTab(tab: string): void {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`${tab}-tab`)?.classList.add('active');
}

function clearAll(): void {
  actions = [];
  selectedActionId = null;
  currentActionIndex = -1;
  updateCount = 0;
  updateTimes = [];
  render();
}

function updateStatus(): void {
  if (!statusTextEl) return;
  const count = Object.keys(allStores).length;
  statusTextEl.textContent = `${count} stores • ${actions.length} actions`;
}

function updatePerfStats(): void {
  if (!perfStatsEl) return;
  const recent = updateTimes.slice(-10);
  const rate = recent.length > 0 ? (1000 / (recent.reduce((a, b) => a + b, 0) / recent.length)).toFixed(1) : '0';
  perfStatsEl.textContent = `${rate} updates/sec`;
}

function getNestedValue(obj: any, path: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function setNestedValue(obj: any, path: string, value: unknown): void {
  if (!path) { Object.assign(obj, value); return; }
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

function formatJson(value: unknown): string {
  return escapeHtml(JSON.stringify(value, null, 2));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', init);
