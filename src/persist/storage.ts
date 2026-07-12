import type { StorageAdapter, StorageInput } from '../types';

export function memoryStorageAdapter(): StorageAdapter {
  const store = new Map<string, string>();

  return {
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

const ssrFallback = memoryStorageAdapter();

function isBrowserStorageAvailable(): boolean {
  return typeof window !== 'undefined';
}

export function localStorageAdapter(): StorageAdapter {
  if (!isBrowserStorageAvailable()) return ssrFallback;

  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => {
      window.localStorage.setItem(key, value);
    },
    removeItem: (key) => {
      window.localStorage.removeItem(key);
    },
  };
}

export function sessionStorageAdapter(): StorageAdapter {
  if (!isBrowserStorageAvailable()) return ssrFallback;

  return {
    getItem: (key) => window.sessionStorage.getItem(key),
    setItem: (key, value) => {
      window.sessionStorage.setItem(key, value);
    },
    removeItem: (key) => {
      window.sessionStorage.removeItem(key);
    },
  };
}

export function resolveStorageAdapter(input?: StorageInput): StorageAdapter {
  if (!input || input === 'local') return localStorageAdapter();
  if (input === 'session') return sessionStorageAdapter();
  if (input === 'memory') return memoryStorageAdapter();
  return input;
}
