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

## Middleware

Import from `@forgedevstack/synapse/middleware`:

- **logger** — Log state changes (with optional diff and timestamp).
- **persist** — Save and restore state to localStorage/sessionStorage; supports version and migrate.
- **immer** — Use mutable-style updates inside `set(fn)` that are applied immutably.
- **undo** — Undo/redo with a history limit.
- **throttle / debounce** — Throttle or debounce updates (optionally by state keys).
- **validate** — Validate state with a Zod-like schema (reject, warn, or fix).
- **sync** — Cross-tab state sync via BroadcastChannel.
- **subscribeWithSelector** — Add `subscribeWithSelector(selector, listener)` to the nucleus for selector-based subscriptions.

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

### Middleware

| Middleware | Description |
|------------|-------------|
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
