# 🐙 Synapse

> Ultra-simple state management for React. No dispatch, no reducers, just signals.

[![npm version](https://img.shields.io/npm/v/@forgedevstack/synapse.svg)](https://www.npmjs.com/package/@forgedevstack/synapse)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@forgedevstack/synapse)](https://bundlephobia.com/package/@forgedevstack/synapse)
[![license](https://img.shields.io/npm/l/@forgedevstack/synapse.svg)](https://github.com/yaghobieh/ForgeStack/blob/main/LICENSE)

## Why Synapse?

State management shouldn't be complicated. Synapse makes it as simple as:

```tsx
// Create your state
const counterNucleus = createNucleus((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
}));

// Use in components
function Counter() {
  const { count, increment, decrement } = useNucleus(counterNucleus);
  return <button onClick={increment}>{count}</button>;
}
```

**No dispatch. No reducers. No selectors. No boilerplate.**

## Features

- **Ultra-simple API** - Create state in seconds
- **Tiny bundle** - < 2KB gzipped
- **Fast** - Minimal re-renders with fine-grained subscriptions
- **DevTools** - Chrome/Safari extension for debugging
- **TypeScript** - Full type safety out of the box
- **Middleware** - Logger, persist, immer-like updates
- **API integration** - Built-in hooks for data fetching
- **Time travel** - Debug with state history
- **React 16.8+** - Works with all modern React versions

## Installation

```bash
npm i @forgedevstack/synapse
# or
yarn add @forgedevstack/synapse
# or
pnpm add @forgedevstack/synapse
```

## Quick Start

### 1. Create a Nucleus (State Container)

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

### 2. Use in Components

```tsx
import { useNucleus, usePick } from '@forgedevstack/synapse';
import { userNucleus } from './state/user';

// Use entire state
function UserProfile() {
  const { user, logout } = useNucleus(userNucleus);
  
  if (!user) return <LoginForm />;
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Or pick specific values (optimized re-renders)
function UserName() {
  const name = usePick(userNucleus, (s) => s.user?.name);
  return <span>{name}</span>;
}
```

## Core Concepts

### Nucleus vs Store

In Synapse, we use **Nucleus** instead of "store". A nucleus is the core of your state - it holds the state and provides methods to update it.

| Redux/Zustand | Synapse |
|--------------|---------|
| `store` | `nucleus` |
| `dispatch(action)` | `set({ ... })` |
| `useSelector()` | `usePick()` |
| `createStore()` | `createNucleus()` |

### Signals (Reactive Primitives)

For simpler state, use signals:

```tsx
import { signal, useSignal } from '@forgedevstack/synapse';

// Create a signal
const count = signal(0);

// Use in component
function Counter() {
  const value = useSignal(count);
  return (
    <button onClick={() => count.set((v) => v + 1)}>
      {value}
    </button>
  );
}
```

### Computed Values

Derive values from signals:

```tsx
import { signal, computed, useComputed } from '@forgedevstack/synapse';

const firstName = signal('John');
const lastName = signal('Doe');

const fullName = computed(() => 
  `${firstName.value} ${lastName.value}`
);

function Name() {
  const name = useComputed(fullName);
  return <h1>{name}</h1>;
}
```

## Middleware

### Logger

```tsx
import { createNucleus } from '@forgedevstack/synapse';
import { logger } from '@forgedevstack/synapse/middleware';

const myNucleus = createNucleus(
  (set) => ({ count: 0 }),
  { 
    middleware: [
      logger({ diff: true, timestamp: true })
    ] 
  }
);
```

### Persist

```tsx
import { persist } from '@forgedevstack/synapse/middleware';

const userNucleus = createNucleus(
  (set) => ({
    name: '',
    email: '',
    preferences: { theme: 'dark' },
  }),
  {
    middleware: [
      persist({
        key: 'user-state',
        storage: 'local', // 'local' | 'session' | custom
        include: ['preferences'], // Only persist preferences
      })
    ]
  }
);
```

### Immer-like Updates

```tsx
import { immer } from '@forgedevstack/synapse/middleware';

const todosNucleus = createNucleus(
  (set) => ({
    todos: [{ id: 1, text: 'Learn Synapse', done: false }],
    
    toggle: (id: number) => set((draft) => {
      // Looks mutable, works immutably!
      const todo = draft.todos.find(t => t.id === id);
      if (todo) todo.done = !todo.done;
    }),
  }),
  { middleware: [immer()] }
);
```

## API Hooks

### useQuery

```tsx
import { useQuery } from '@forgedevstack/synapse';

function UserList() {
  const { data, loading, error, refetch } = useQuery(
    () => fetch('/api/users').then(r => r.json()),
    { refetchOnFocus: true }
  );
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <ul>
      {data?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

### useMutation

```tsx
import { useMutation } from '@forgedevstack/synapse';

function CreateUser() {
  const { mutate, loading } = useMutation(
    (data) => fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(r => r.json()),
    {
      onSuccess: (user) => navigate(`/users/${user.id}`),
    }
  );
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutate({ name: e.target.name.value });
    }}>
      <input name="name" />
      <button disabled={loading}>Create</button>
    </form>
  );
}
```

## DevTools

Install the Synapse DevTools browser extension to:

- Inspect all nuclei in your app
- Time-travel through state history
- Export/import state for debugging
- Reset state to initial values

[Download for Chrome](https://chrome.google.com/webstore/detail/synapse-devtools) | [Download for Safari](https://apps.apple.com/app/synapse-devtools)

## Configuration

### Synapse Config

```tsx
import { createNucleus, type SynapseConfig } from '@forgedevstack/synapse';

const config: SynapseConfig = {
  // Action naming convention
  actionNaming: 'camelCase', // 'camelCase' | 'PascalCase' | 'snake_case' | 'SCREAMING_SNAKE_CASE'
  
  // DevTools (auto-enabled in development)
  devtools: true,
  devtoolsName: 'MyApp',
  
  // Enable action logging
  logging: process.env.NODE_ENV === 'development',
  
  // Persist state
  persist: {
    key: 'app-state',
    storage: 'local',
  },
};

const appNucleus = createNucleus((set) => ({
  // state...
}), config);
```

## TypeScript

Synapse is written in TypeScript and provides excellent type inference:

```tsx
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

interface TodosState {
  todos: Todo[];
  filter: 'all' | 'active' | 'done';
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  setFilter: (filter: 'all' | 'active' | 'done') => void;
}

const todosNucleus = createNucleus<TodosState>((set) => ({
  todos: [],
  filter: 'all',
  
  addTodo: (text) => set((state) => ({
    todos: [...state.todos, { id: Date.now(), text, done: false }],
  })),
  
  toggleTodo: (id) => set((state) => ({
    todos: state.todos.map(t => 
      t.id === id ? { ...t, done: !t.done } : t
    ),
  })),
  
  setFilter: (filter) => set({ filter }),
}));
```

## API Reference

### Core

| Function | Description |
|----------|-------------|
| `createNucleus(initializer, config?)` | Create a new nucleus |
| `signal(initialValue)` | Create a reactive signal |
| `computed(computeFn)` | Create a derived signal |
| `batch(fn)` | Batch multiple updates |
| `effect(fn)` | Run side effects on signal changes |

### Hooks

| Hook | Description |
|------|-------------|
| `useNucleus(nucleus)` | Use entire nucleus state |
| `usePick(nucleus, selector)` | Use selected state slice |
| `useNuclei([...nuclei])` | Use multiple nuclei |
| `useSignal(signal)` | Use signal value |
| `useComputed(computed)` | Use computed value |
| `useQuery(fetcher, options?)` | Fetch data with state |
| `useMutation(mutationFn, options?)` | Handle mutations |
| `useSubscribe(nucleus, callback)` | Subscribe to changes |
| `useSnapshot(nucleus)` | Get state without subscribing |

### Middleware

| Middleware | Description |
|------------|-------------|
| `logger(options?)` | Log state changes |
| `persist(options)` | Persist state to storage |
| `immer()` | Enable mutable-style updates |

## Comparison

| Feature | Synapse | Redux | Zustand | Jotai |
|---------|---------|-------|---------|-------|
| Bundle size | ~2KB | ~7KB | ~1KB | ~3KB |
| Boilerplate | Minimal | Heavy | Low | Low |
| TypeScript | Native | Needs setup | Good | Good |
| DevTools | Built-in | Extension | Extension | Extension |
| Async actions | Native | Middleware | Native | Native |
| Learning curve | Easy | Steep | Easy | Medium |

## License

MIT © [John Yaghobieh](https://github.com/yaghobieh/Synapse)

---

Part of the [ForgeStack](https://forgedevstack.com/) ecosystem.

