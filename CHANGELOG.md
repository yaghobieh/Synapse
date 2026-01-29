# Changelog

All notable changes to Synapse will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-18

### 🎉 Initial Release

Welcome to Synapse - ultra-simple state management for React!

### Added

#### Core
- **`createNucleus`** - Create state containers with a simple API
- **`signal`** - Reactive primitives for fine-grained reactivity
- **`computed`** - Derived values that update automatically
- **`batch`** - Batch multiple updates for performance
- **`effect`** - Run side effects on state changes

#### Hooks
- **`useNucleus`** - Use entire nucleus state in components
- **`usePick`** - Select specific state slices with optimized re-renders
- **`useNuclei`** - Use multiple nuclei together
- **`useSignal`** - Use signal values in components
- **`useComputed`** - Use computed values in components
- **`useLocalSignal`** - Create component-local signals
- **`useLocalComputed`** - Create component-local computed values
- **`useQuery`** - Data fetching with loading/error states
- **`useMutation`** - Handle mutations with status tracking
- **`useApi`** - Simplified REST API operations
- **`useSubscribe`** - Subscribe to state changes
- **`useSnapshot`** - Get state without subscribing
- **`useAction`** - Create stable action references

#### Middleware
- **`logger`** - Log state changes for debugging
- **`persist`** - Persist state to localStorage/sessionStorage
- **`immer`** - Enable mutable-style immutable updates

#### DevTools
- Chrome/Safari extension for state inspection
- Time-travel debugging
- State export/import
- Reset functionality

#### Utilities
- Deep clone and merge utilities
- Naming convention converters (camelCase, PascalCase, snake_case, SCREAMING_SNAKE_CASE)
- Deep equality checking
- Path-based object access

### Features
- 🚀 Ultra-simple API - no dispatch, no reducers, no selectors
- 🪶 Tiny bundle size (< 2KB gzipped)
- ⚡ Minimal re-renders with fine-grained subscriptions
- 📦 Full TypeScript support with type inference
- 🔌 Extensible middleware system
- 🌐 Built-in API integration hooks
- ⏱️ Time-travel debugging with DevTools
- 🎯 Compatible with React 16.8+

---

## Roadmap

### [0.2.0] - Planned
- [ ] React Server Components support
- [ ] Improved DevTools with state diff visualization
- [ ] Safari extension for DevTools
- [ ] Undo/redo middleware
- [ ] Form integration utilities

### [0.3.0] - Future
- [ ] React Native support
- [ ] Server-side state hydration
- [ ] Concurrent mode optimizations
- [ ] State machine integration

