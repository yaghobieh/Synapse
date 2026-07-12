# Changelog

All notable changes to **Synapse** are documented here.

---

## [1.2.1] — 2026-07-12

### Added

- **Persistence core** (`attachPersistence`) — opt-in store persistence, now wired directly into `createNucleus` via the `persist` config option:
  - `persist: { key, storage?, namespace?, include?, exclude?, version?, migrate?, debounceMs?, serialize?, deserialize? }` hydrates on store creation and saves on every change with debounced writes (default `PERSIST_NUMBERS.DEBOUNCE_MS` = 250 ms).
  - Returns a `PersistHandle` (`rehydrated` promise, `flush()`, `clear()`, `stop()`); `nucleus.destroy()` stops persistence automatically.
- **Storage adapters** — `StorageAdapter` interface (`getItem` / `setItem` / `removeItem`, sync or async) with built-ins:
  - `localStorageAdapter()`, `sessionStorageAdapter()` — fall back to in-memory storage in SSR/Node.
  - `memoryStorageAdapter()` — explicit in-memory storage (`storage: 'memory'`).
  - `resolveStorageAdapter(input)` — resolves `'local' | 'session' | 'memory'` or a custom adapter.
- **Middleware pipeline** — the `middleware: [...]` config option on `createNucleus` is now functional. Middleware wraps both action `set` calls and direct `nucleus.set` calls, and receives the real `nucleus`, `initialState`, and config.
- **`interceptor({ before, after })` middleware** — intercept updates before they apply (transform by returning a new partial, cancel by returning `false`) and observe state after each change.
- **`composeMiddleware(...middlewares)`** — combine several middleware into one, applied left-to-right.
- **`reduxDevtools(options?)` middleware** — connects to the Redux DevTools Extension via `window.__REDUX_DEVTOOLS_EXTENSION__` when present (state inspection + jump/time-travel), no-op otherwise. Zero dependencies.
- **Test suite** — vitest coverage for storage adapters, persistence (hydration, migrate, include/exclude, debounce, async storage), the middleware pipeline, and the Redux DevTools connector.

### Changed

- `persist` middleware now shares the persistence core (`attachPersistence`) and accepts `namespace`, `debounceMs`, and `'memory'` storage; default write debounce is now 250 ms (was 1000 ms).
- `clearPersisted(key, storage?, namespace?)` accepts any `StorageInput` and an optional namespace.
- `SynapseConfig` is now generic (`SynapseConfig<T>`) to type the `middleware` array; existing non-generic usage keeps working.

---

## [1.2.0] — 2026-03-03

### Added

- **API tracker: request and response headers** — `initApiTracking()` now records `requestHeaders` and `responseHeaders` for each intercepted `fetch` call, so DevTools can show full request/response details (RTK-style).

### Changed

- None.

---

## [1.1.0] — 2026-02-24

### Added

- **`useNucleus` selector overload** — `useNucleus(n, s => s.foo)` subscribes to a slice with optimised re-renders, removing the need for a separate `usePick` call in most cases.
- **`useNucleusSlice`** — pick multiple keys from a nucleus in a single subscription: `useNucleusSlice(n, ['count', 'increment'])`.
- **`batchUpdates`** — explicit batching for synchronous nucleus updates. All `set()` calls inside `batchUpdates(() => { … })` produce a single listener notification.
- **`shallowEqual` utility** — new `shallowEqual(a, b)` function in `utils/object`. Used as the default equality function in `usePick`, replacing `Object.is` for object / array slices.
- **`usePick` shallow equality default** — selectors that return objects or arrays no longer cause spurious re-renders when the top-level values haven't changed.
- **`subscribeWithSelector` middleware** — external subscribers can now filter by a selector so they only fire when a specific slice changes.
- **Testing utilities** (`@forgedevstack/synapse/testing`):
  - `createTestNucleus(init, overrides?)` — creates a nucleus with devtools & persist disabled.
  - `waitForState(n, predicate, opts?)` — async helper that resolves when state satisfies a predicate (or rejects on timeout).
  - `collectSnapshots(n)` — records emitted state snapshots for assertions.
- **Persist middleware improvements**:
  - Async storage support — `getItem` / `setItem` may now return `Promise`.
  - Safe rehydration — only hydrates keys that exist in the current state shape.
  - Version mismatch without `migrate` now skips hydration instead of corrupting state.

### Changed

- `usePick` default equality changed from `Object.is` to `shallowEqual`.
- Nucleus `set()` now schedules notifications through a batching layer — multiple synchronous calls in the same `batchUpdates` scope fire listeners once.

---

## [1.0.0] — 2026-01-15

### Added

- `createNucleus` — core state container.
- `signal`, `computed`, `batch`, `effect` — reactive primitives.
- React hooks: `useNucleus`, `usePick`, `useNuclei`, `useAction`, `useSubscribe`, `useSnapshot`, `useSignal`, `useComputed`, `useLocalSignal`, `useLocalComputed`, `useQuery`, `useMutation`, `useApi`.
- Middleware: `logger`, `persist`, `immer`, `undo`, `throttle`, `debounce`, `validate`, `sync`.
- DevTools integration with state history and time-travel.
- Full TypeScript support.
