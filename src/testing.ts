/**
 * Synapse Testing Utilities
 *
 * Helpers for unit-testing components and logic that depend on Synapse state.
 *
 * @example
 * ```ts
 * import { createTestNucleus, waitForState } from '@forgedevstack/synapse/testing';
 *
 * const nucleus = createTestNucleus((set) => ({
 *   count: 0,
 *   increment: () => set(s => ({ count: s.count + 1 })),
 * }));
 *
 * nucleus.get().increment();
 * expect(nucleus.get().count).toBe(1);
 *
 * await waitForState(nucleus, s => s.count > 5, { timeout: 2000 });
 * ```
 */

import { createNucleus } from './core/nucleus';
import type { Nucleus, StateInitializer, SynapseConfig } from './types';

/**
 * Create a nucleus configured for tests — devtools, logging, and persist
 * are disabled so tests run in isolation without side-effects.
 */
export function createTestNucleus<T extends object>(
  initializer: StateInitializer<T>,
  overrides: Partial<SynapseConfig<T>> = {},
): Nucleus<T> {
  return createNucleus(initializer, {
    devtools: false,
    logging: false,
    persist: false,
    ...overrides,
  });
}

/**
 * Wait until a nucleus state satisfies a predicate.
 * Resolves with the matching state or rejects after `timeout` ms.
 */
export function waitForState<T extends object>(
  nucleus: Nucleus<T>,
  predicate: (state: T) => boolean,
  options: { timeout?: number } = {},
): Promise<T> {
  const { timeout = 5000 } = options;

  if (predicate(nucleus.get())) {
    return Promise.resolve(nucleus.get());
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(new Error(`waitForState timed out after ${timeout}ms`));
    }, timeout);

    const unsubscribe = nucleus.subscribe((state) => {
      if (predicate(state)) {
        clearTimeout(timer);
        unsubscribe();
        resolve(state);
      }
    });
  });
}

/**
 * Collect state snapshots emitted by a nucleus.
 * Returns a `snapshots` array and a `stop` function.
 *
 * @example
 * ```ts
 * const { snapshots, stop } = collectSnapshots(counterNucleus);
 * counterNucleus.get().increment();
 * counterNucleus.get().increment();
 * stop();
 * expect(snapshots).toHaveLength(2);
 * ```
 */
export function collectSnapshots<T extends object>(
  nucleus: Nucleus<T>,
): { snapshots: T[]; stop: () => void } {
  const snapshots: T[] = [];
  const unsubscribe = nucleus.subscribe((state) => {
    snapshots.push(state);
  });
  return { snapshots, stop: unsubscribe };
}
