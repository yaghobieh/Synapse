# Synapse — Improvement Ideas

Ways to improve Synapse for DX, performance, and ecosystem fit.

---

## 1. **API & DX**

- **`useNucleus` with optional selector**  
  Allow `useNucleus(nucleus, selector?)` so components can subscribe to a slice without a separate `usePick` when they only need a few fields. Reduces re-renders and keeps the API familiar (e.g. Zustand-style).

- **Shallow equality by default in `usePick`**  
  Use a default shallow compare for objects/arrays so nested reference changes don’t trigger re-renders when the selected “value” is effectively the same. Keep `Object.is` for primitives.

- **`useNucleusSlice` / multi-key pick**  
  A hook that takes multiple keys and returns a tuple or object, e.g. `useNucleusSlice(nucleus, ['count', 'increment'])`, to avoid several `usePick` calls and one subscription.

- **Stable action references in docs**  
  Document that actions from `createNucleus` are stable (same reference), so they’re safe in dependency arrays and for passing to children. Call out `useAction` when extra stability is needed.

---

## 2. **Persistence & Hydration**

- **Partial rehydration for `persist`**  
  Allow rehydrating only a subset of state (e.g. `include`/`exclude` plus version) so old stored shapes don’t break the app. Optional `migrate(oldState, version)` for schema changes.

- **SSR / hydration**  
  Document or add a small recipe for SSR: serialize nucleus state on the server, pass to client, and rehydrate in a single pass to avoid flash of wrong state. Optional `getServerSnapshot()`-style API if needed.

---

## 3. **Middleware & Plugins**

- **`subscribeWithSelector`-style middleware**  
  Middleware that only notifies when selected slices change, so external subscribers (e.g. persistence, analytics) can avoid unnecessary work.

- **DevTools: persist middleware integration**  
  In DevTools, show which keys are persisted and optionally “Rehydrate from storage” for the current nucleus.

- **Middleware ordering / naming**  
  Document recommended order (e.g. persist last so it sees final state) and optional names for debugging (e.g. in DevTools).

---

## 4. **Testing**

- **Testing utilities package or export**  
  Export helpers such as `createTestNucleus(initialState)` (no DevTools, no persist), `waitForState(nucleus, predicate)`, and/or a small `@forgedevstack/synapse-testing` with React Testing Library–style helpers.

- **Mock nucleus in tests**  
  Document how to replace a nucleus with a mock (e.g. React context or a test double) so components can be tested in isolation.

---

## 5. **Performance**

- **Batching**  
  Ensure all sync updates in the same tick are batched (single subscriber notification). If not already, wrap `set` in a microtask or use React’s batching where applicable.

- **Selector memoization**  
  In `usePick`, consider memoizing the selector result when the selector is inline (e.g. `state => state.foo.bar`) to avoid unnecessary updates when the parent re-renders with a new function reference. Ref-based selector is already there; document that stable selector references are better.

- **Large state**  
  Document patterns for very large state (e.g. normalizing, splitting into multiple nuclei, or using signals for hot paths).

---

## 6. **Docs & Portal**

- **ForgeStack portal**  
  Keep Synapse docs on the portal in sync with README and CHANGELOG. Add a “Recipes” section: forms, auth state, API cache + nucleus, etc.

- **Comparison table**  
  Expand the comparison (Redux, Zustand, Jotai) with a row for “SSR”, “Persistence”, “DevTools”, “Bundle size”, “Learning curve”.

- **Migration guides**  
  Short “From Redux” / “From Zustand” snippets showing the same app in Synapse (nucleus + hooks).

---

## 7. **Types & Inference**

- **Stricter inference for `set`**  
  Ensure `set` in the initializer is typed so that partial updates and updater functions are inferred correctly (no accidental overwriting of entire state).

- **Branded nucleus type**  
  Optional branded type for the nucleus instance so it can’t be confused with plain objects when passing across boundaries.

---

## 8. **Ecosystem**

- **Compass integration**  
  Example or small helper: e.g. “Load route-specific data into a nucleus when the route matches” (with Compass or similar router).

- **Forge Query + Synapse**  
  Recipe: use Synapse for UI/local state and Forge Query for server cache; or store Forge Query cache keys in a nucleus for invalidation.

- **Bear + Synapse**  
  Example: theme or sidebar state in a nucleus consumed by Bear components.

---

## Quick wins (good first issues)

1. Add **BUZZ_LINES**-style one-liners to README (e.g. “No dispatch. No reducers. No selectors.”).
2. Document **selector stability** for `usePick` (inline vs stable reference).
3. Export **version** from the package (e.g. `import { VERSION } from '@forgedevstack/synapse'`) for debugging and docs.
4. Add **JSDoc `@example`** to all public hooks and `createNucleus` in the source for better IDE and doc generation.
