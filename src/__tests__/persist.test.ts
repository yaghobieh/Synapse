import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNucleus } from '../core/nucleus';
import { attachPersistence } from '../persist/persistence';
import { memoryStorageAdapter, resolveStorageAdapter } from '../persist/storage';
import { PERSIST_DEFAULTS, PERSIST_NUMBERS } from '../constants/persist.const';
import type { StorageAdapter } from '../types';

interface CounterState {
  count: number;
  label: string;
  increment: () => void;
}

const TEST_CONFIG = { devtools: false, logging: false } as const;

function createCounter(config = {}) {
  return createNucleus<CounterState>(
    (set) => ({
      count: 0,
      label: 'counter',
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    { ...TEST_CONFIG, ...config },
  );
}

describe('memoryStorageAdapter', () => {
  it('stores and removes values', () => {
    const adapter = memoryStorageAdapter();
    expect(adapter.getItem('a')).toBeNull();
    adapter.setItem('a', '1');
    expect(adapter.getItem('a')).toBe('1');
    adapter.removeItem('a');
    expect(adapter.getItem('a')).toBeNull();
  });
});

describe('resolveStorageAdapter', () => {
  it('falls back to in-memory storage outside the browser', () => {
    const local = resolveStorageAdapter('local');
    local.setItem('k', 'v');
    expect(local.getItem('k')).toBe('v');
  });

  it('returns custom adapters unchanged', () => {
    const custom = memoryStorageAdapter();
    expect(resolveStorageAdapter(custom)).toBe(custom);
  });
});

describe('attachPersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes state to storage with namespace and debounce', () => {
    const adapter = memoryStorageAdapter();
    const nucleus = createCounter();
    attachPersistence(nucleus, { key: 'counter', storage: adapter });

    nucleus.get().increment();
    expect(adapter.getItem(`${PERSIST_DEFAULTS.NAMESPACE}counter`)).toBeNull();

    vi.advanceTimersByTime(PERSIST_NUMBERS.DEBOUNCE_MS);

    const raw = adapter.getItem(`${PERSIST_DEFAULTS.NAMESPACE}counter`) as string;
    const envelope = JSON.parse(raw);
    expect(envelope.state).toEqual({ count: 1, label: 'counter' });
    expect(envelope.version).toBe(PERSIST_DEFAULTS.VERSION);
  });

  it('hydrates state on attach', () => {
    const adapter = memoryStorageAdapter();
    adapter.setItem(
      `${PERSIST_DEFAULTS.NAMESPACE}counter`,
      JSON.stringify({ state: { count: 7 }, version: 1, timestamp: Date.now() }),
    );

    const nucleus = createCounter();
    attachPersistence(nucleus, { key: 'counter', storage: adapter });

    expect(nucleus.get().count).toBe(7);
    expect(nucleus.get().label).toBe('counter');
    expect(typeof nucleus.get().increment).toBe('function');
  });

  it('supports async storage adapters', async () => {
    vi.useRealTimers();
    const backing = memoryStorageAdapter();
    backing.setItem(
      `${PERSIST_DEFAULTS.NAMESPACE}counter`,
      JSON.stringify({ state: { count: 3 }, version: 1, timestamp: Date.now() }),
    );
    const asyncAdapter: StorageAdapter = {
      getItem: async (key) => backing.getItem(key) as string | null,
      setItem: async (key, value) => {
        backing.setItem(key, value);
      },
      removeItem: async (key) => {
        backing.removeItem(key);
      },
    };

    const nucleus = createCounter();
    const handle = attachPersistence(nucleus, { key: 'counter', storage: asyncAdapter });
    await handle.rehydrated;

    expect(nucleus.get().count).toBe(3);
  });

  it('persists only included fields', () => {
    const adapter = memoryStorageAdapter();
    const nucleus = createCounter();
    attachPersistence(nucleus, {
      key: 'counter',
      storage: adapter,
      include: ['count'],
    });

    nucleus.get().increment();
    vi.advanceTimersByTime(PERSIST_NUMBERS.DEBOUNCE_MS);

    const envelope = JSON.parse(
      adapter.getItem(`${PERSIST_DEFAULTS.NAMESPACE}counter`) as string,
    );
    expect(envelope.state).toEqual({ count: 1 });
  });

  it('skips excluded fields', () => {
    const adapter = memoryStorageAdapter();
    const nucleus = createCounter();
    attachPersistence(nucleus, {
      key: 'counter',
      storage: adapter,
      exclude: ['label'],
    });

    nucleus.get().increment();
    vi.advanceTimersByTime(PERSIST_NUMBERS.DEBOUNCE_MS);

    const envelope = JSON.parse(
      adapter.getItem(`${PERSIST_DEFAULTS.NAMESPACE}counter`) as string,
    );
    expect(envelope.state).toEqual({ count: 1 });
  });

  it('runs migrate when persisted version differs', () => {
    const adapter = memoryStorageAdapter();
    adapter.setItem(
      `${PERSIST_DEFAULTS.NAMESPACE}counter`,
      JSON.stringify({ state: { count: 5 }, version: 1, timestamp: Date.now() }),
    );

    const nucleus = createCounter();
    attachPersistence(nucleus, {
      key: 'counter',
      storage: adapter,
      version: 2,
      migrate: (persisted) => ({
        ...(persisted as { count: number }),
        count: (persisted as { count: number }).count * 10,
      }),
    });

    expect(nucleus.get().count).toBe(50);
  });

  it('skips hydration on version mismatch without migrate', () => {
    const adapter = memoryStorageAdapter();
    adapter.setItem(
      `${PERSIST_DEFAULTS.NAMESPACE}counter`,
      JSON.stringify({ state: { count: 5 }, version: 1, timestamp: Date.now() }),
    );

    const nucleus = createCounter();
    attachPersistence(nucleus, { key: 'counter', storage: adapter, version: 2 });

    expect(nucleus.get().count).toBe(0);
  });

  it('supports custom namespace, flush, and clear', () => {
    const adapter = memoryStorageAdapter();
    const nucleus = createCounter();
    const handle = attachPersistence(nucleus, {
      key: 'counter',
      storage: adapter,
      namespace: 'app:',
    });

    nucleus.get().increment();
    handle.flush();
    expect(adapter.getItem('app:counter')).not.toBeNull();

    handle.clear();
    expect(adapter.getItem('app:counter')).toBeNull();
  });

  it('stops writing after stop()', () => {
    const adapter = memoryStorageAdapter();
    const nucleus = createCounter();
    const handle = attachPersistence(nucleus, { key: 'counter', storage: adapter });

    handle.stop();
    nucleus.get().increment();
    vi.advanceTimersByTime(PERSIST_NUMBERS.DEBOUNCE_MS);

    expect(adapter.getItem(`${PERSIST_DEFAULTS.NAMESPACE}counter`)).toBeNull();
  });
});

describe('createNucleus persist config', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hydrates and persists through the persist config option', () => {
    const adapter = memoryStorageAdapter();
    adapter.setItem(
      `${PERSIST_DEFAULTS.NAMESPACE}session`,
      JSON.stringify({ state: { count: 9 }, version: 1, timestamp: Date.now() }),
    );

    const nucleus = createCounter({
      persist: { key: 'session', storage: adapter },
    });

    expect(nucleus.get().count).toBe(9);

    nucleus.get().increment();
    vi.advanceTimersByTime(PERSIST_NUMBERS.DEBOUNCE_MS);

    const envelope = JSON.parse(
      adapter.getItem(`${PERSIST_DEFAULTS.NAMESPACE}session`) as string,
    );
    expect(envelope.state.count).toBe(10);
  });

  it('stops persistence when the nucleus is destroyed', () => {
    const adapter = memoryStorageAdapter();
    const nucleus = createCounter({
      persist: { key: 'destroyable', storage: adapter },
    });

    nucleus.destroy();
    expect(() => vi.advanceTimersByTime(PERSIST_NUMBERS.DEBOUNCE_MS)).not.toThrow();
  });
});
