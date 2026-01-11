import {
  createStore,
  combineReducers,
  thunkMiddleware,
  loggerMiddleware,
  createApiMiddleware,
  initConfig
} from '../../index';

// Initialize configuration
initConfig({
  debug: {
    enabled: true,
    logger: true,
    devtools: true
  },
  api: {
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 5000
  }
});

// Import slices
import { counterReducer } from './slices/counter.slice';
import { usersReducer } from './slices/users.slice';
import { todosReducer } from './slices/todos.slice';

// Combine all reducers
export const rootReducer = combineReducers({
  counter: counterReducer,
  users: usersReducer,
  todos: todosReducer,
});

// Create middleware
const middleware = [
  thunkMiddleware(),
  createApiMiddleware({
    transformResponse: (data) => data,
  }),
  loggerMiddleware({
    collapsed: true,
    diff: true,
    timestamp: true
  })
];

// Create store
export const store = createStore(rootReducer, {
  middleware,
  devTools: true,
  debug: true
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Add custom methods to store (like Redux)
(store as any).dispatch = (...args: any[]) => {
  if (Array.isArray(args[0])) {
    // Handle multi-action dispatch
    return args[0].map((action: any) => store.dispatch(action));
  }
  return store.dispatch(args[0]);
};

// Add waitFor method
(store as any).waitFor = (actionType: string, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      // Check if the action was dispatched (simplified check)
      resolve(state);
      unsubscribe();
    });

    setTimeout(() => {
      unsubscribe();
      reject(new Error(`Timeout waiting for action: ${actionType}`));
    }, timeout);
  });
};

export default store;
