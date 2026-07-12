export interface MiddlewareHooks<T extends object = object> {
  before?: (update: Partial<T>, state: T) => Partial<T> | false | void;
  after?: (state: T, prevState: T) => void;
}

export interface ReduxDevtoolsOptions {
  name?: string;
  actionType?: string;
}

export interface ReduxDevtoolsMessage {
  type: string;
  payload?: { type?: string };
  state?: string;
}

export interface ReduxDevtoolsConnection {
  init: (state: unknown) => void;
  send: (action: { type: string }, state: unknown) => void;
  subscribe: (listener: (message: ReduxDevtoolsMessage) => void) => () => void;
}

export interface ReduxDevtoolsExtension {
  connect: (options: { name: string }) => ReduxDevtoolsConnection;
}
