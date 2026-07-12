import type {
  Middleware,
  ReduxDevtoolsExtension,
  ReduxDevtoolsOptions,
  SetState,
} from '../types';
import {
  REDUX_DEVTOOLS_DEFAULTS,
  REDUX_DEVTOOLS_EXTENSION_KEY,
  REDUX_DEVTOOLS_MESSAGES,
} from '../constants/reduxDevtools.const';

function getExtension(): ReduxDevtoolsExtension | null {
  if (typeof window === 'undefined') return null;
  const extension = (window as unknown as Record<string, unknown>)[
    REDUX_DEVTOOLS_EXTENSION_KEY
  ];
  return extension ? (extension as ReduxDevtoolsExtension) : null;
}

function stripFunctions<T extends object>(state: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(state)) {
    const value = (state as Record<string, unknown>)[key];
    if (typeof value !== 'function') {
      result[key] = value;
    }
  }
  return result;
}

export function reduxDevtools<T extends object>(
  options: ReduxDevtoolsOptions = {},
): Middleware<T> {
  const {
    name = REDUX_DEVTOOLS_DEFAULTS.NAME,
    actionType = REDUX_DEVTOOLS_DEFAULTS.ACTION_TYPE,
  } = options;

  return () => (set, get, nucleus) => {
    const extension = getExtension();
    if (!extension) {
      return ((partial, replace) => {
        set(partial, replace);
      }) as SetState<T>;
    }

    const connection = extension.connect({ name });
    let isRestoring = false;

    connection.init(stripFunctions(get()));

    connection.subscribe((message) => {
      if (message.type !== REDUX_DEVTOOLS_MESSAGES.DISPATCH || !message.state) return;

      const payloadType = message.payload?.type;
      const isJump =
        payloadType === REDUX_DEVTOOLS_MESSAGES.JUMP_TO_ACTION ||
        payloadType === REDUX_DEVTOOLS_MESSAGES.JUMP_TO_STATE;
      if (!isJump) return;

      try {
        const restored = JSON.parse(message.state) as Partial<T>;
        isRestoring = true;
        nucleus.set(restored);
      } catch {
        return;
      } finally {
        isRestoring = false;
      }
    });

    nucleus.subscribe((state) => {
      if (isRestoring) return;
      connection.send({ type: actionType }, stripFunctions(state));
    });

    return ((partial, replace) => {
      set(partial, replace);
    }) as SetState<T>;
  };
}
