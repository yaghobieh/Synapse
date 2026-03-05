const CFG = { POLL_MS: 250, MAX_ACTIONS: 300, MAX_PERF: 100, MAX_SNAPS: 20 };

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
  stores: Record<string, Record<string, unknown>>;
  timestamp: number;
}

interface ApiCall {
  id: number;
  method: string;
  url: string;
  status: number | null;
  requestBody?: unknown;
  responseBody?: unknown;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  duration: number | null;
  timestamp: number;
}

let allStores: Record<string, Record<string, unknown>> = {};
let actions: ActionEntry[] = [];
let snapshots: Snapshot[] = [];
let selectedId: number | null = null;
let activeTab: 'changes' | 'state' | 'raw' = 'changes';
let expanded = new Set<string>();
let searchQuery = '';
let nextId = 0;
let snapId = 0;
let updateCount = 0;
let updateTimes: number[] = [];
let lastUpdate = Date.now();
let apiCalls: ApiCall[] = [];
let selectedApiId: number | null = null;
let editStore = '';
let editKey = '';
let changedKeys = new Set<string>();
let changedStore = '';

let $actList: HTMLElement;
let $actCount: HTMLElement;
let $detailTabs: HTMLElement;
let $detailBody: HTMLElement;
let $apiBody: HTMLElement;
let $apiCount: HTMLElement;
let $search: HTMLInputElement;
let $snapSection: HTMLElement;
let $snapList: HTMLElement;
let $snapCount: HTMLElement;

function init(): void {
  // Register this panel with the background and link to the inspected tab (activeTab flow)
  const params = new URLSearchParams(window.location.search);
  const tabIdParam = params.get('tabId');
  if (tabIdParam) {
    const tabId = parseInt(tabIdParam, 10);
    if (!isNaN(tabId)) {
      try {
        const port = (chrome as any).runtime.connect({ name: 'synapse-devtools' });
        port.postMessage({ type: 'SET_TAB_ID', tabId });
      } catch (_e) {
        // Extension context invalidated or not available
      }
    }
  }

  $actList     = el('act-list');
  $actCount    = el('act-count');
  $detailTabs  = el('detail-tabs');
  $detailBody  = el('detail-body');
  $apiBody     = el('api-body');
  $apiCount    = el('api-count');
  $search      = el('search') as HTMLInputElement;
  $snapSection = el('snap-section');
  $snapList    = el('snap-list');
  $snapCount   = el('snap-count');

  $search?.addEventListener('input', () => {
    searchQuery = $search.value.toLowerCase();
    renderActions();
  });

  $detailTabs?.querySelectorAll('.dtab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = (btn as HTMLElement).dataset.tab as typeof activeTab;
      $detailTabs.querySelectorAll('.dtab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDetail();
    });
  });

  el('btn-snap')?.addEventListener('click', takeSnapshot);
  el('btn-export')?.addEventListener('click', exportState);
  el('btn-import')?.addEventListener('click', () => el('import-modal')?.classList.remove('hidden'));
  el('btn-clear')?.addEventListener('click', clearAll);

  el('close-import')?.addEventListener('click', () => el('import-modal')?.classList.add('hidden'));
  el('do-import')?.addEventListener('click', doImport);
  el('close-edit')?.addEventListener('click', () => el('edit-modal')?.classList.add('hidden'));
  el('do-edit')?.addEventListener('click', saveEdit);

  el('bottom-hd')?.addEventListener('click', () => {
    const b = el('api-body');
    if (b) b.style.display = b.style.display === 'none' ? '' : 'none';
  });

  poll();
  setInterval(poll, CFG.POLL_MS);
}

function poll(): void {
  try {
    const code = `(function(){
      var d = window.__SYNAPSE_DEVTOOLS__;
      var a = window.__SYNAPSE_API_CALLS__;
      return JSON.stringify({d:d,a:a||[]});
    })()`;

    (chrome as any).devtools.inspectedWindow.eval(
      code,
      (raw: string | null, err: unknown) => {
        if (err || !raw) return;
        let result: { d?: any; a?: ApiCall[] };
        try { result = JSON.parse(raw); } catch { return; }

        const devtools = result.d;
        if (!devtools?.nuclei) return;

        Object.entries(devtools.nuclei).forEach(([_id, nucleus]: [string, any]) => {
          const name: string = nucleus.name;
          if (name === '__signals__') return;
          const state = cleanState(nucleus.state || {});
          const prev = allStores[name];

          if (prev && JSON.stringify(prev) !== JSON.stringify(state)) {
            const lastH = nucleus.history?.[nucleus.history.length - 1];
            actions.unshift({
              id: ++nextId,
              store: name,
              action: lastH?.action || 'SET',
              state: JSON.parse(JSON.stringify(state)),
              prevState: JSON.parse(JSON.stringify(prev)),
              timestamp: Date.now(),
            });
            updateCount++;
            updateTimes.push(Date.now() - lastUpdate);
            lastUpdate = Date.now();
            if (updateTimes.length > CFG.MAX_PERF) updateTimes.shift();
            if (actions.length > CFG.MAX_ACTIONS) actions.pop();
          }

          allStores[name] = state;
        });

        if (result.a && Array.isArray(result.a)) {
          apiCalls = result.a;
        }

        render();
      },
    );
  } catch { /* context gone */ }
}

function cleanState(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'function') continue;
    if (typeof v === 'string' && v.includes('[Function')) continue;
    if (Array.isArray(v)) out[k] = v.filter(x => typeof x !== 'function');
    else if (v && typeof v === 'object') out[k] = cleanState(v);
    else out[k] = v;
  }
  return out;
}

function render(): void {
  renderActions();
  renderDetail();
  renderApi();
  renderSnapshots();
}

// ---- Actions ----
function renderActions(): void {
  if (!$actList || !$actCount) return;
  const list = filtered();
  $actCount.textContent = String(list.length);

  if (!Object.keys(allStores).length) {
    $actList.innerHTML = '<div class="empty">Waiting for Synapse...</div>';
    return;
  }

  let html = '';
  list.forEach(a => {
    const sel = a.id === selectedId ? ' sel' : '';
    html += `<div class="act${sel}" data-id="${a.id}">
      <span class="dot set"></span>
      <span class="act-name">${esc(a.action)}</span>
      <span class="act-store">${esc(a.store)}</span>
      <span class="act-time">${fmtTime(a.timestamp)}</span>
    </div>`;
  });

  Object.keys(allStores).forEach(name => {
    html += `<div class="act" data-init="1">
      <span class="dot init"></span>
      <span class="act-name">INIT</span>
      <span class="act-store">${esc(name)}</span>
    </div>`;
  });

  $actList.innerHTML = html;

  $actList.querySelectorAll('.act[data-id]').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt((row as HTMLElement).dataset.id!, 10);
      selectedId = id;
      computeChanged();
      $detailTabs?.classList.remove('hidden');
      renderDetail();
      renderActions();
    });
  });
}

function filtered(): ActionEntry[] {
  let list = actions;
  if (searchQuery) {
    list = list.filter(a =>
      a.action.toLowerCase().includes(searchQuery) ||
      a.store.toLowerCase().includes(searchQuery),
    );
  }
  return list;
}

function computeChanged(): void {
  changedKeys.clear();
  changedStore = '';
  const act = actions.find(a => a.id === selectedId);
  if (!act) return;
  changedStore = act.store;
  const allK = new Set([...Object.keys(act.prevState), ...Object.keys(act.state)]);
  allK.forEach(key => {
    if (JSON.stringify(act.prevState[key]) !== JSON.stringify(act.state[key])) {
      changedKeys.add(key);
    }
  });
}

// ---- Detail ----
function renderDetail(): void {
  if (!$detailBody) return;

  const hasStores = Object.keys(allStores).length > 0;
  const act = actions.find(a => a.id === selectedId);

  // Always show tabs if we have stores (State tab works without action)
  if (hasStores) {
    $detailTabs?.classList.remove('hidden');
  } else {
    $detailTabs?.classList.add('hidden');
    $detailBody.innerHTML = '<div class="empty">Waiting for Synapse stores...</div>';
    return;
  }

  if (activeTab === 'state') {
    renderStateTree();
    return;
  }

  if (!act) {
    $detailBody.innerHTML = '<div class="empty">Click an action to see changes and raw payload.<br>Switch to State tab to browse all stores.</div>';
    return;
  }

  if (activeTab === 'changes') renderChanges(act);
  else renderRaw(act);
}

function renderChanges(act: ActionEntry): void {
  let html = '';
  const allK = new Set([...Object.keys(act.prevState), ...Object.keys(act.state)]);
  let count = 0;

  allK.forEach(key => {
    const before = act.prevState[key];
    const after = act.state[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      count++;
      html += `<div class="diff-block">
        <div class="diff-key">${esc(key)}</div>
        <div class="diff-line rm">\u2212 ${fmtJson(before)}</div>
        <div class="diff-line add">+ ${fmtJson(after)}</div>
      </div>`;
    }
  });

  if (!count) html = '<div class="empty">No state changes detected</div>';

  const avg = updateTimes.length
    ? (updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length).toFixed(0) : '0';
  const storeCount = Object.keys(allStores).length;
  const size = fmtSize(JSON.stringify(allStores).length);

  html += `<div class="perf-row">
    <div class="perf-card"><div class="perf-val">${updateCount}</div><div class="perf-lbl">Updates</div></div>
    <div class="perf-card"><div class="perf-val">${avg}ms</div><div class="perf-lbl">Avg</div></div>
    <div class="perf-card"><div class="perf-val">${storeCount}</div><div class="perf-lbl">Nuclei</div></div>
    <div class="perf-card"><div class="perf-val">${size}</div><div class="perf-lbl">Size</div></div>
  </div>`;

  $detailBody.innerHTML = html;
}

function renderStateTree(): void {
  let html = '<div class="tree">';

  for (const [storeName, storeState] of Object.entries(allStores)) {
    const isExp = expanded.has(storeName);
    const keyCount = Object.keys(storeState).length;
    const isActionStore = storeName === changedStore;

    html += `<div class="t-row t-store" data-path="${storeName}">
      <span class="t-arrow">${isExp ? '\u25BC' : '\u25B6'}</span>
      <span class="t-key" style="font-weight:700">${esc(storeName)}</span>
      <span class="t-colon">:</span>
      <span class="t-bracket">{${keyCount}}</span>
    </div>`;

    if (isExp) {
      for (const [k, v] of Object.entries(storeState)) {
        const hl = isActionStore && changedKeys.has(k);
        html += renderTree(k, v, `${storeName}.${k}`, 1, storeName, hl);
      }
    }
  }

  html += '</div>';
  $detailBody.innerHTML = html;
  attachTreeClicks();
}

function renderTree(key: string, value: unknown, path: string, depth: number, store: string, highlight: boolean): string {
  const isObj = value !== null && typeof value === 'object';
  const isExp = expanded.has(path);
  const pad = depth * 14;
  const hl = highlight ? ' changed' : '';

  let html = '';
  if (isObj) {
    const count = Array.isArray(value) ? value.length : Object.keys(value as object).length;
    const bracket = Array.isArray(value) ? `[${count}]` : `{${count}}`;
    html += `<div class="t-row${hl}" style="padding-left:${pad}px" data-path="${path}">
      <span class="t-arrow">${isExp ? '\u25BC' : '\u25B6'}</span>
      <span class="t-key">${esc(key)}</span><span class="t-colon">:</span>
      <span class="t-bracket">${bracket}</span>
    </div>`;
    if (isExp) {
      const entries = Array.isArray(value)
        ? value.map((v, i) => [String(i), v] as [string, unknown])
        : Object.entries(value as object);
      entries.forEach(([k, v]) => {
        html += renderTree(k, v, `${path}.${k}`, depth + 1, store, highlight);
      });
    }
  } else {
    const keyPath = path.split('.').slice(1).join('.');
    html += `<div class="t-row editable${hl}" style="padding-left:${pad}px" data-path="${path}" data-store="${store}" data-key="${keyPath}">
      <span class="t-arrow"></span>
      <span class="t-key">${esc(key)}</span><span class="t-colon">:</span>
      ${renderVal(value)}
    </div>`;
  }
  return html;
}

function renderVal(value: unknown): string {
  if (value === null) return '<span class="t-nil">null</span>';
  if (value === undefined) return '<span class="t-nil">undefined</span>';
  if (typeof value === 'string') return `<span class="t-str">"${esc(value)}"</span>`;
  if (typeof value === 'number') return `<span class="t-num">${value}</span>`;
  if (typeof value === 'boolean') return `<span class="t-bool">${value}</span>`;
  return esc(String(value));
}

function attachTreeClicks(): void {
  $detailBody?.querySelectorAll('.t-row').forEach(row => {
    row.addEventListener('click', () => {
      const r = row as HTMLElement;
      const path = r.dataset.path!;

      if (r.classList.contains('editable')) {
        openEdit(r.dataset.store!, r.dataset.key!);
        return;
      }

      if (expanded.has(path)) expanded.delete(path);
      else expanded.add(path);
      renderStateTree();
    });
  });
}

function renderRaw(act: ActionEntry): void {
  const payload = {
    action: act.action,
    store: act.store,
    timestamp: new Date(act.timestamp).toISOString(),
    prevState: act.prevState,
    state: act.state,
  };
  $detailBody.innerHTML = `<pre class="raw-pre">${esc(JSON.stringify(payload, null, 2))}</pre>`;
}

// ---- API ----
function renderApi(): void {
  if (!$apiBody || !$apiCount) return;
  $apiCount.textContent = String(apiCalls.length);

  if (!apiCalls.length) {
    $apiBody.innerHTML = `<div class="empty" style="padding:8px">No API calls tracked.<br>
      Call <code>initApiTracking()</code> in your app,<br>then make fetch requests.</div>`;
    return;
  }

  let html = '';
  apiCalls.slice(0, 60).forEach(c => {
    const stCls = c.status === null ? 'pen' : (c.status >= 200 && c.status < 400 ? 'ok' : 'err');
    const dur = c.duration !== null ? `${c.duration}ms` : '...';
    const sel = c.id === selectedApiId ? ' sel' : '';

    html += `<div class="api-row${sel}" data-api="${c.id}">
      <span class="method ${c.method}">${esc(c.method)}</span>
      <span class="api-url">${esc(c.url)}</span>
      <span class="api-st ${stCls}">${c.status ?? '...'}</span>
      <span class="api-dur">${dur}</span>
    </div>`;

    if (c.id === selectedApiId) {
      html += renderApiDetail(c);
    }
  });

  $apiBody.innerHTML = html;

  $apiBody.querySelectorAll('.api-row[data-api]').forEach(row => {
    row.addEventListener('click', () => {
      const id = parseInt((row as HTMLElement).dataset.api!, 10);
      selectedApiId = selectedApiId === id ? null : id;
      renderApi();
    });
  });
}

function renderApiDetail(c: ApiCall): string {
  const reqH = c.requestHeaders && Object.keys(c.requestHeaders).length ? prettyJson(c.requestHeaders) : null;
  const resH = c.responseHeaders && Object.keys(c.responseHeaders).length ? prettyJson(c.responseHeaders) : null;

  return `<div class="api-detail">
    <div><span class="lbl">Status</span> ${c.status ?? 'pending'}</div>
    <div><span class="lbl">Duration</span> ${c.duration !== null ? c.duration + 'ms' : 'pending'}</div>
    <div><span class="lbl">Time</span> ${new Date(c.timestamp).toLocaleTimeString()}</div>
    ${reqH ? `<div><span class="lbl">Req Hdrs</span></div><pre>${esc(reqH)}</pre>` : ''}
    ${c.requestBody ? `<div><span class="lbl">Req Body</span></div><pre>${esc(prettyJson(c.requestBody))}</pre>` : ''}
    ${resH ? `<div><span class="lbl">Res Hdrs</span></div><pre>${esc(resH)}</pre>` : ''}
    ${c.responseBody ? `<div><span class="lbl">Res Body</span></div><pre>${esc(prettyJson(c.responseBody))}</pre>` : ''}
  </div>`;
}

// ---- Snapshots ----
function takeSnapshot(): void {
  snapshots.unshift({
    id: ++snapId,
    name: `Snap ${snapId}`,
    stores: JSON.parse(JSON.stringify(allStores)),
    timestamp: Date.now(),
  });
  if (snapshots.length > CFG.MAX_SNAPS) snapshots.pop();
  renderSnapshots();
}

function renderSnapshots(): void {
  if (!$snapSection || !$snapList || !$snapCount) return;

  if (!snapshots.length) {
    $snapSection.classList.add('hidden');
    return;
  }

  $snapSection.classList.remove('hidden');
  $snapCount.textContent = String(snapshots.length);

  $snapList.innerHTML = snapshots.map(s =>
    `<div class="snap-row" data-snap="${s.id}">
      <span class="snap-name">${esc(s.name)}</span>
      <span class="snap-time">${fmtTime(s.timestamp)}</span>
      <button class="snap-restore" data-snap-restore="${s.id}">Restore</button>
    </div>`,
  ).join('');

  $snapList.querySelectorAll('.snap-restore').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      restoreSnapshot(parseInt((btn as HTMLElement).dataset.snapRestore!, 10));
    });
  });
}

function restoreSnapshot(id: number): void {
  const snap = snapshots.find(s => s.id === id);
  if (!snap) return;
  Object.entries(snap.stores).forEach(([store, state]) => {
    (chrome as any).devtools.inspectedWindow.eval(
      `window.postMessage({type:'SYNAPSE_DEVTOOLS_UPDATE',nucleusName:'${store}',path:'',value:${JSON.stringify(state)}},'*');`,
    );
    allStores[store] = state as Record<string, unknown>;
  });
  render();
}

// ---- Edit ----
function openEdit(store: string, key: string): void {
  editStore = store;
  editKey = key;
  const value = getPath(allStores[store], key);
  const $label = el('edit-label');
  const $text = el('edit-text') as HTMLTextAreaElement;
  if ($label) $label.textContent = `${store}.${key}`;
  if ($text) $text.value = JSON.stringify(value, null, 2);
  el('edit-modal')?.classList.remove('hidden');
}

function saveEdit(): void {
  if (!editStore) return;
  try {
    const $text = el('edit-text') as HTMLTextAreaElement;
    const v = JSON.parse($text.value);
    (chrome as any).devtools.inspectedWindow.eval(
      `window.postMessage({type:'SYNAPSE_DEVTOOLS_UPDATE',nucleusName:'${editStore}',path:'${editKey}',value:${JSON.stringify(v)}},'*');`,
    );
    setPath(allStores[editStore], editKey, v);
    el('edit-modal')?.classList.add('hidden');
    render();
  } catch { alert('Invalid JSON'); }
}

// ---- Export / Import / Clear ----
function exportState(): void {
  const data = JSON.stringify({ stores: allStores, actions, snapshots }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `synapse-${Date.now()}.json`;
  a.click();
}

function doImport(): void {
  const $text = el('import-text') as HTMLTextAreaElement;
  try {
    const data = JSON.parse($text.value);
    if (data.stores) {
      Object.entries(data.stores).forEach(([store, state]) => {
        (chrome as any).devtools.inspectedWindow.eval(
          `window.postMessage({type:'SYNAPSE_DEVTOOLS_UPDATE',nucleusName:'${store}',path:'',value:${JSON.stringify(state)}},'*');`,
        );
        allStores[store] = state as Record<string, unknown>;
      });
    }
    if (data.snapshots) snapshots = data.snapshots;
    el('import-modal')?.classList.add('hidden');
    $text.value = '';
    render();
  } catch { alert('Invalid JSON'); }
}

function clearAll(): void {
  actions = [];
  selectedId = null;
  updateCount = 0;
  updateTimes = [];
  changedKeys.clear();
  changedStore = '';
  render();
}

// ---- Helpers ----
function el(id: string): HTMLElement { return document.getElementById(id)!; }

function getPath(obj: any, path: string): unknown {
  if (!path) return obj;
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function setPath(obj: any, path: string, value: unknown): void {
  if (!path) { Object.assign(obj, value); return; }
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

function prettyJson(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function fmtJson(value: unknown): string { return esc(JSON.stringify(value, null, 2)); }
function fmtTime(ts: number): string { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }

function fmtSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'K';
  return (bytes / 1048576).toFixed(1) + 'M';
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', init);
