import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNucleus } from '../core/nucleus';
import { interceptor } from '../middleware/interceptor';
import { composeMiddleware } from '../middleware/compose';
import { logger } from '../middleware/logger';
import { reduxDevtools } from '../middleware/reduxDevtools';
import {
  REDUX_DEVTOOLS_EXTENSION_KEY,
  REDUX_DEVTOOLS_MESSAGES,
} from '../constants/reduxDevtools.const';
import type {
  Middleware,
  ReduxDevtoolsConnection,
  ReduxDevtoolsMessage,
} from '../types';

interface CounterState {
  count: number;
  increment: () => void;
}

const TEST_CONFIG = { devtools: false, logging: false } as const;

function createCounter(middleware: Middleware<CounterState>[]) {
  return createNucleus<CounterState>(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    { ...TEST_CONFIG, middleware },
  );
}

describe('middleware pipeline via config', () => {
  it('routes action updates through middleware', () => {
    const before = vi.fn();
    const after = vi.fn();
    const nucleus = createCounter([interceptor({ before, after })]);

    nucleus.get().increment();

    expect(before).toHaveBeenCalledWith({ count: 1 }, expect.objectContaining({ count: 0 }));
    expect(after).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 }),
      expect.objectContaining({ count: 0 }),
    );
    expect(nucleus.get().count).toBe(1);
  });

  it('routes direct nucleus.set calls through middleware', () => {
    const before = vi.fn();
    const nucleus = createCounter([interceptor({ before })]);

    nucleus.set({ count: 42 });

    expect(before).toHaveBeenCalledTimes(1);
    expect(nucleus.get().count).toBe(42);
  });

  it('allows before to cancel an update', () => {
    const nucleus = createCounter([
      interceptor({
        before: (update) => ((update.count ?? 0) > 1 ? false : undefined),
      }),
    ]);

    nucleus.set({ count: 1 });
    expect(nucleus.get().count).toBe(1);

    nucleus.set({ count: 5 });
    expect(nucleus.get().count).toBe(1);
  });

  it('allows before to transform an update', () => {
    const nucleus = createCounter([
      interceptor({
        before: (update) => ({ ...update, count: (update.count ?? 0) * 2 }),
      }),
    ]);

    nucleus.set({ count: 3 });
    expect(nucleus.get().count).toBe(6);
  });

  it('composes multiple middleware in order', () => {
    const calls: string[] = [];
    const track = (label: string): Middleware<CounterState> =>
      interceptor({ before: () => void calls.push(label) });

    const nucleus = createCounter([
      composeMiddleware(track('outer'), track('inner')),
    ]);

    nucleus.set({ count: 1 });
    expect(calls).toEqual(['outer', 'inner']);
    expect(nucleus.get().count).toBe(1);
  });

  it('supports the logger middleware in the pipeline', () => {
    const output = vi.fn();
    const nucleus = createCounter([
      logger({ logger: output, timestamp: false }),
    ]);

    nucleus.get().increment();
    expect(output).toHaveBeenCalled();
    expect(nucleus.get().count).toBe(1);
  });
});

describe('reduxDevtools middleware', () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>).window;
  });

  it('is a no-op when the extension is missing', () => {
    const nucleus = createCounter([reduxDevtools()]);
    nucleus.get().increment();
    expect(nucleus.get().count).toBe(1);
  });

  it('connects, inits, and sends state updates when the extension exists', () => {
    const init = vi.fn();
    const send = vi.fn();
    const holder: { listener: ((message: ReduxDevtoolsMessage) => void) | null } = {
      listener: null,
    };

    const connection: ReduxDevtoolsConnection = {
      init,
      send,
      subscribe: (listener) => {
        holder.listener = listener;
        return () => {
          holder.listener = null;
        };
      },
    };

    (globalThis as Record<string, unknown>).window = {
      [REDUX_DEVTOOLS_EXTENSION_KEY]: {
        connect: () => connection,
      },
    };

    const nucleus = createCounter([reduxDevtools({ name: 'Test' })]);

    expect(init).toHaveBeenCalledWith(expect.objectContaining({ count: 0 }));

    nucleus.get().increment();
    expect(send).toHaveBeenCalledWith(
      { type: 'SET' },
      expect.objectContaining({ count: 1 }),
    );

    send.mockClear();
    holder.listener?.({
      type: REDUX_DEVTOOLS_MESSAGES.DISPATCH,
      payload: { type: REDUX_DEVTOOLS_MESSAGES.JUMP_TO_ACTION },
      state: JSON.stringify({ count: 99 }),
    });

    expect(nucleus.get().count).toBe(99);
    expect(send).not.toHaveBeenCalled();
  });
});
