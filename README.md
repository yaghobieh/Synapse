# Synapse

Ultra-simple state management for React. No dispatch, no reducers, no selectors. Create a nucleus and use it in your components.

[![npm version](https://img.shields.io/npm/v/@forgedevstack/synapse.svg)](https://www.npmjs.com/package/@forgedevstack/synapse)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@forgedevstack/synapse)](https://bundlephobia.com/package/@forgedevstack/synapse)
[![license](https://img.shields.io/npm/l/@forgedevstack/synapse.svg)](https://github.com/yaghobieh/ForgeStack/blob/main/LICENSE)

---

**No dispatch. No reducers. No selectors. No boilerplate.**

Create state in one line. Use it everywhere. No provider required.

---

## What is Synapse?

Synapse is a small state library for React. You define state and actions in a single place (a "nucleus"), then read and update that state from any component with hooks. It is designed to be minimal: no actions, no reducers, no store provider. You call `set()` with partial state or an updater function, and components that use that state re-render.

Synapse fits apps that want React-friendly state without Redux or heavy setup. It supports batching, persistence, time-travel debugging via the Chrome DevTools extension, and optional signals for fine-grained updates.

---

## Why Synapse?

- **Simple API** — One function to create state (`createNucleus`), one hook to use it (`useNucleus`). Optional selector for slices.
- **Small** — Under 2 KB gzipped.
- **Fast** — Batched updates and shallow equality in selectors reduce unnecessary re-renders.
- **TypeScript** — Typed out of the box.
- **DevTools** — Chrome extension: inspect nuclei, time-travel, export/import state, view API call list with request/response and headers.
- **Middleware** — Logger, persist, undo, throttle, debounce, validate, cross-tab sync, immer-style updates.
- **Testing** — Helpers in `@forgedevstack/synapse/testing`: `createTestNucleus`, `waitForState`, `collectSnapshots`.

---

## Installation

```bash
npm i @forgedevstack/synapse
# or
yarn add @forgedevstack/synapse
# or
pnpm add @forgedevstack/synapse
```

Requires React 16.8+ (hooks).

---

## Quick Start

### 1. Create a Nucleus (state container)

```tsx
import { createNucleus } from '@forgedevstack/synapse';

interface UserState {
  user: { name: string; email: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const userNucleus = createNucleus<UserState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    const user = await api.login(email, password);
    set({ user, loading: false });
  },

  logout: () => set({ user: null }),
}));
```

### 2. Use in components

```tsx
import { useNucleus, usePick, useNucleusSlice } from '@forgedevstack/synapse';

// Full state
function UserProfile() {
  const { user, logout } = useNucleus(userNucleus);
  if (!user) return <LoginForm />;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Selector: re-renders only when name changes
function UserName() {
  const name = useNucleus(userNucleus, (s) => s.user?.name);
  return <span>{name}</span>;
}

// Multiple keys in one subscription
function LoginButton() {
  const { loading, login } = useNucleusSlice(userNucleus, ['loading', 'login']);
  return <button disabled={loading} onClick={() => login('a', 'b')}>Log in</button>;
}
```

### 3. Batch updates

```tsx
import { batchUpdates } from '@forgedevstack/synapse';

batchUpdates(() => {
  myNucleus.set({ a: 1 });
  myNucleus.set({ b: 2 });
});
// Listeners fire once with { a: 1, b: 2 }
```

---

## Core concepts

### Nucleus vs store

In Synapse, state lives in a **nucleus**. You create it with `createNucleus(initializer)`. The initializer receives `set`, `get`, and the nucleus; you return the initial state (including functions that call `set`). There is no separate "dispatch" or "actions" object.

| Redux / Zustand | Synapse |
|-----------------|---------|
| store           | nucleus |
| dispatch(action)| set({ ... }) |
| useSelector()   | usePick() / useNucleus(n, selector) |
| createStore()   | createNucleus() |

### Signals (optional)

For local or shared primitive state you can use signals: `signal(0)`, `computed(() => ...)`, and hooks `useSignal`, `useComputed`. Signals work alongside nuclei.

---

## DevTools

Install the **Synapse DevTools** Chrome extension to:

- Inspect all nuclei and their state
- Time-travel through action history (and use the time slider)
- Filter by nucleus (store tabs in the top bar)
- Export and import state for debugging
- View API calls: list of fetch/XHR with method, URL, status, duration; click a call to see request and response headers and body (RTK-style)

Load the extension from `synapse/devtools-extension/dist` as an unpacked extension in `chrome://extensions`. Open DevTools and select the "Synapse" tab.

---

## Persistence

Opt in per nucleus with the `persist` config option. State is hydrated from storage on creation and saved on every change with debounced writes (250 ms by default).

```tsx
import { createNucleus } from '@forgedevstack/synapse';

const settingsNucleus = createNucleus(
  (set) => ({
    theme: 'dark',
    locale: 'en',
    draft: '',
    setTheme: (theme: string) => set({ theme }),
  }),
  {
    persist: {
      key: 'settings',            // stored as 'synapse:settings'
      storage: 'local',           // 'local' | 'session' | 'memory' | custom adapter
      include: ['theme', 'locale'], // partial persistence — 'draft' is not saved
      version: 2,
      migrate: (old, fromVersion) => {
        if (fromVersion === 1) return { ...(old as object), locale: 'en' };
        return old;
      },
      debounceMs: 250,
    },
  },
);
```

### Storage adapters

Any object with `getItem` / `setItem` / `removeItem` (sync or async) works as a `StorageAdapter`. Built-ins:

```ts
import {
  localStorageAdapter,
  sessionStorageAdapter,
  memoryStorageAdapter,
} from '@forgedevstack/synapse';
```

`localStorageAdapter()` and `sessionStorageAdapter()` automatically fall back to in-memory storage in SSR/Node, so persisted nuclei are safe to create on the server. Async adapters (e.g. backed by IndexedDB or a remote API) are supported — return promises from the adapter methods.

### Standalone use

`attachPersistence` works with any existing nucleus and returns a handle:

```ts
import { attachPersistence } from '@forgedevstack/synapse';

const handle = attachPersistence(cartNucleus, { key: 'cart', storage: 'session' });

await handle.rehydrated; // hydration finished (relevant for async storage)
handle.flush();          // write immediately, skipping the debounce
handle.clear();          // remove the persisted entry
handle.stop();           // detach (also called by nucleus.destroy())
```

---

## Middleware

Pass a pipeline through the `middleware` config option — every update (action `set` calls and direct `nucleus.set`) flows through it:

```tsx
import { createNucleus } from '@forgedevstack/synapse';
import { interceptor, logger, composeMiddleware } from '@forgedevstack/synapse/middleware';

const nucleus = createNucleus(
  (set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }),
  {
    middleware: [
      interceptor({
        before: (update, state) => {
          if ((update.count ?? 0) < 0) return false;       // cancel the update
          return { ...update, count: (update.count ?? 0) }; // or transform it
        },
        after: (state, prevState) => {
          analytics.track('state-change', { count: state.count });
        },
      }),
      logger({ diff: true }),
    ],
  },
);
```

`composeMiddleware(a, b, c)` combines several middleware into a single one, applied left-to-right.

Available middleware (import from `@forgedevstack/synapse/middleware`):

- **interceptor** — Before/after hooks around every update; `before` can transform or cancel.
- **composeMiddleware** — Combine multiple middleware into one.
- **logger** — Log state changes (with optional diff and timestamp).
- **persist** — Save and restore state (localStorage/sessionStorage/memory/custom, versioned migrations, debounced writes).
- **reduxDevtools** — Redux DevTools Extension connector (see below).
- **immer** — Use mutable-style updates inside `set(fn)` that are applied immutably.
- **undo** — Undo/redo with a history limit.
- **throttle / debounce** — Throttle or debounce updates (optionally by state keys).
- **validate** — Validate state with a Zod-like schema (reject, warn, or fix).
- **sync** — Cross-tab state sync via BroadcastChannel.
- **subscribeWithSelector** — Add `subscribeWithSelector(selector, listener)` to the nucleus for selector-based subscriptions.

### Redux DevTools

If the [Redux DevTools Extension](https://github.com/reduxjs/redux-devtools) is installed, connect a nucleus to it — state changes appear in the extension and jump/time-travel works. When the extension is absent the middleware is a silent no-op, and it adds zero dependencies.

```tsx
import { reduxDevtools } from '@forgedevstack/synapse/middleware';

const nucleus = createNucleus(
  (set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }),
  { middleware: [reduxDevtools({ name: 'Counter' })] },
);
```

---

## API overview

**Core:** `createNucleus`, `batchUpdates`, `signal`, `computed`, `batch`, `effect`

**Hooks:** `useNucleus`, `usePick`, `useNucleusSlice`, `useNuclei`, `useAction`, `useSubscribe`, `useSnapshot`, `useSignal`, `useComputed`, `useQuery`, `useMutation`

**Testing:** `createTestNucleus`, `waitForState`, `collectSnapshots` from `@forgedevstack/synapse/testing`

See the full [API Reference](#api-reference) table in this README and the repository for more detail.

---

## API Reference

### Core

| Function | Description |
|----------|-------------|
| `createNucleus(init, config?)` | Create a new nucleus |
| `batchUpdates(fn)` | Batch synchronous updates; listeners fire once |
| `signal(value, name?)` | Create a reactive signal |
| `computed(fn)` | Create a derived signal |
| `batch(fn)` | Batch signal updates |
| `effect(fn)` | Run side effects on signal changes |

### Hooks

| Hook | Description |
|------|-------------|
| `useNucleus(n)` | Use entire nucleus state |
| `useNucleus(n, selector)` | Use a slice (optimised re-renders) |
| `usePick(n, selector, eq?)` | Select state with custom equality (default shallow) |
| `useNucleusSlice(n, keys)` | Pick multiple keys in one subscription |
| `useNuclei([...])` | Use multiple nuclei |
| `useAction(fn)` | Stable action reference |
| `useSubscribe(n, cb)` | Subscribe to changes (no re-render) |
| `useSnapshot(n)` | Get state getter (no re-render) |
| `useSignal(sig)` | Use signal value |
| `useComputed(comp)` | Use computed value |
| `useQuery(fetcher, opts?)` | Fetch data with state |
| `useMutation(fn, opts?)` | Handle mutations |

### Persistence

| Function | Description |
|----------|-------------|
| `attachPersistence(n, opts)` | Persist a nucleus; returns `{ rehydrated, flush, clear, stop }` |
| `localStorageAdapter()` | localStorage adapter (in-memory fallback on SSR) |
| `sessionStorageAdapter()` | sessionStorage adapter (in-memory fallback on SSR) |
| `memoryStorageAdapter()` | In-memory storage adapter |
| `resolveStorageAdapter(input)` | Resolve `'local' \| 'session' \| 'memory'` or custom adapter |

### Middleware

| Middleware | Description |
|------------|-------------|
| `interceptor(hooks)` | Before/after hooks; transform or cancel updates |
| `composeMiddleware(...mws)` | Combine middleware into one |
| `reduxDevtools(opts?)` | Redux DevTools Extension connector (no-op if absent) |
| `logger(opts?)` | Log state changes |
| `persist(opts)` | Save / restore state (sync and async storage, versioned migrations) |
| `immer()` | Mutable-style immutable updates |
| `undo(opts?)` | Undo / redo with history |
| `throttle(opts?)` | Throttle state updates |
| `debounce(opts?)` | Debounce state updates |
| `validate(opts)` | Validate state with Zod-like schemas |
| `sync(opts)` | Cross-tab state sync via BroadcastChannel |
| `subscribeWithSelector()` | Selector-based external subscriptions |

### Testing (`@forgedevstack/synapse/testing`)

| Utility | Description |
|---------|-------------|
| `createTestNucleus(init, overrides?)` | Nucleus with devtools and persist disabled |
| `waitForState(n, predicate, opts?)` | Await a state condition |
| `collectSnapshots(n)` | Record emitted states |

---

## Comparison

| Feature | Synapse | Redux | Zustand | Jotai |
|---------|---------|-------|---------|-------|
| Bundle size | ~2 KB | ~7 KB | ~1 KB | ~3 KB |
| Boilerplate | Minimal | Heavy | Low | Low |
| TypeScript | Native | Needs setup | Good | Good |
| DevTools | Chrome extension | Extension | Extension | Extension |
| Async actions | Native | Middleware | Native | Native |
| Persistence | Middleware | Manual | Manual | Plugin |
| Undo / Redo | Middleware | Manual | Manual | — |
| Cross-tab sync | Middleware | — | — | — |
| Testing utils | synapse/testing | — | — | — |
| Learning curve | Easy | Steep | Easy | Medium |

---

## License

MIT © [John Yaghobieh](https://github.com/yaghobieh)

Part of the [ForgeStack](https://forgestack.dev) ecosystem.
