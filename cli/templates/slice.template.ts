/**
 * Synapse CLI - Templates
 * File templates for code generation
 */

/**
 * Slice file template
 */
export function sliceTemplate(
  pascalName: string,
  camelName: string,
  snakeName: string
): string {
  return `/**
 * ${pascalName} Slice
 * State management for ${camelName}
 */

import { createSlice } from "synapse-state";
import type { ${pascalName}State } from "./${camelName.toLowerCase()}.types";

/**
 * Initial state
 */
const initialState: ${pascalName}State = {
  data: null,
  items: [],
  isLoading: false,
  error: null,
};

/**
 * ${pascalName} slice
 */
export const ${camelName}Slice = createSlice({
  name: "${camelName}",
  initialState,
  reducers: {
    /**
     * Set loading state
     */
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    /**
     * Set data
     */
    setData: (state, action) => {
      state.data = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Set items
     */
    setItems: (state, action) => {
      state.items = action.payload;
      state.isLoading = false;
      state.error = null;
    },

    /**
     * Add item
     */
    addItem: (state, action) => {
      state.items.push(action.payload);
    },

    /**
     * Update item
     */
    updateItem: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.items.findIndex((item: { id: unknown }) => item.id === id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...updates };
      }
    },

    /**
     * Remove item
     */
    removeItem: (state, action) => {
      state.items = state.items.filter((item: { id: unknown }) => item.id !== action.payload);
    },

    /**
     * Set error
     */
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    /**
     * Reset state
     */
    reset: () => initialState,
  },
});

/**
 * Export actions
 */
export const ${camelName}Actions = ${camelName}Slice.actions;

/**
 * Export reducer
 */
export const ${camelName}Reducer = ${camelName}Slice.reducer;

/**
 * Selectors
 */
export const select${pascalName}State = (state: { ${camelName}: ${pascalName}State }) => state.${camelName};
export const select${pascalName}Data = (state: { ${camelName}: ${pascalName}State }) => state.${camelName}.data;
export const select${pascalName}Items = (state: { ${camelName}: ${pascalName}State }) => state.${camelName}.items;
export const select${pascalName}Loading = (state: { ${camelName}: ${pascalName}State }) => state.${camelName}.isLoading;
export const select${pascalName}Error = (state: { ${camelName}: ${pascalName}State }) => state.${camelName}.error;
`;
}

/**
 * Types file template
 */
export function sliceTypesTemplate(
  pascalName: string,
  camelName: string
): string {
  return `/**
 * ${pascalName} Types
 */

/**
 * ${pascalName} item interface
 */
export interface ${pascalName}Item {
  id: string | number;
  // Add your item properties here
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ${pascalName} state interface
 */
export interface ${pascalName}State {
  data: ${pascalName}Item | null;
  items: ${pascalName}Item[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Create ${pascalName} payload
 */
export interface Create${pascalName}Payload {
  // Add your create payload properties here
  name: string;
}

/**
 * Update ${pascalName} payload
 */
export interface Update${pascalName}Payload {
  id: string | number;
  // Add your update payload properties here
  name?: string;
}

/**
 * API response types
 */
export interface ${pascalName}Response {
  data: ${pascalName}Item;
  message?: string;
}

export interface ${pascalName}ListResponse {
  data: ${pascalName}Item[];
  total: number;
  page: number;
  limit: number;
}
`;
}

/**
 * API file template
 */
export function sliceApiTemplate(
  pascalName: string,
  camelName: string,
  snakeName: string
): string {
  return `/**
 * ${pascalName} API
 * API calls for ${camelName}
 */

import { createApiAction, createGetAction, createPostAction, createPutAction, createDeleteAction } from "synapse-state";
import type { Create${pascalName}Payload, Update${pascalName}Payload } from "./${camelName.toLowerCase()}.types";

/**
 * API Endpoints
 */
const ENDPOINTS = {
  BASE: "/${camelName.toLowerCase()}",
  BY_ID: (id: string | number) => \`/${camelName.toLowerCase()}/\${id}\`,
};

/**
 * Action Types
 */
export const ${snakeName}_API = {
  FETCH_ALL: "${snakeName}/FETCH_ALL",
  FETCH_ONE: "${snakeName}/FETCH_ONE",
  CREATE: "${snakeName}/CREATE",
  UPDATE: "${snakeName}/UPDATE",
  DELETE: "${snakeName}/DELETE",
};

/**
 * Fetch all ${camelName} items
 */
export const fetchAll${pascalName} = () =>
  createGetAction(${snakeName}_API.FETCH_ALL, ENDPOINTS.BASE);

/**
 * Fetch single ${camelName} by ID
 */
export const fetch${pascalName}ById = (id: string | number) =>
  createGetAction(${snakeName}_API.FETCH_ONE, ENDPOINTS.BY_ID(id));

/**
 * Create new ${camelName}
 */
export const create${pascalName} = (data: Create${pascalName}Payload) =>
  createPostAction(${snakeName}_API.CREATE, ENDPOINTS.BASE, data);

/**
 * Update ${camelName}
 */
export const update${pascalName} = (id: string | number, data: Update${pascalName}Payload) =>
  createPutAction(${snakeName}_API.UPDATE, ENDPOINTS.BY_ID(id), data);

/**
 * Delete ${camelName}
 */
export const delete${pascalName} = (id: string | number) =>
  createDeleteAction(${snakeName}_API.DELETE, ENDPOINTS.BY_ID(id));
`;
}

/**
 * Saga file template
 */
export function sliceSagaTemplate(
  pascalName: string,
  camelName: string,
  snakeName: string
): string {
  return `/**
 * ${pascalName} Saga
 * Side effects for ${camelName}
 */

import { takeLatest, put, call, select } from "synapse-state";
import type { Effect } from "synapse-state";
import { ${camelName}Actions, select${pascalName}State } from "./${camelName.toLowerCase()}.slice";
import { ${snakeName}_API } from "./${camelName.toLowerCase()}.api";

/**
 * Handle fetch all ${camelName}
 */
function* handleFetchAll(): Generator<Effect, void, unknown> {
  try {
    yield put(${camelName}Actions.setLoading(true));
    
    // API call is handled by API middleware
    // This saga can do additional processing
    
  } catch (error) {
    yield put(${camelName}Actions.setError(
      error instanceof Error ? error.message : "An error occurred"
    ));
  }
}

/**
 * Handle fetch ${camelName} success
 */
function* handleFetchSuccess(action: { payload: unknown }): Generator<Effect, void, unknown> {
  yield put(${camelName}Actions.setItems(action.payload as []));
}

/**
 * Handle fetch ${camelName} error
 */
function* handleFetchError(action: { payload: Error }): Generator<Effect, void, unknown> {
  yield put(${camelName}Actions.setError(action.payload.message));
}

/**
 * Handle create ${camelName} success
 */
function* handleCreateSuccess(action: { payload: unknown }): Generator<Effect, void, unknown> {
  yield put(${camelName}Actions.addItem(action.payload));
}

/**
 * Handle update ${camelName} success
 */
function* handleUpdateSuccess(action: { payload: unknown }): Generator<Effect, void, unknown> {
  yield put(${camelName}Actions.updateItem(action.payload));
}

/**
 * Handle delete ${camelName} success
 */
function* handleDeleteSuccess(action: { payload: { id: string | number } }): Generator<Effect, void, unknown> {
  yield put(${camelName}Actions.removeItem(action.payload.id));
}

/**
 * Root ${camelName} saga
 */
export function* ${camelName}Saga(): Generator<Effect, void, unknown> {
  yield takeLatest(\`\${${snakeName}_API.FETCH_ALL}_REQUEST\`, handleFetchAll);
  yield takeLatest(\`\${${snakeName}_API.FETCH_ALL}_SUCCESS\`, handleFetchSuccess);
  yield takeLatest(\`\${${snakeName}_API.FETCH_ALL}_FAILURE\`, handleFetchError);
  yield takeLatest(\`\${${snakeName}_API.CREATE}_SUCCESS\`, handleCreateSuccess);
  yield takeLatest(\`\${${snakeName}_API.UPDATE}_SUCCESS\`, handleUpdateSuccess);
  yield takeLatest(\`\${${snakeName}_API.DELETE}_SUCCESS\`, handleDeleteSuccess);
}
`;
}

/**
 * Store file template
 */
export function storeTemplate(): string {
  return `/**
 * Synapse Store
 * Main store configuration
 */

import {
  createStore,
  thunkMiddleware,
  loggerMiddleware,
  createApiMiddleware,
  createSagaMiddleware,
} from "synapse-state";
import { rootReducer } from "./rootReducer";
import { rootSaga } from "./rootSaga";

/**
 * Create middleware
 */
const sagaMiddleware = createSagaMiddleware();
const apiMiddleware = createApiMiddleware();

/**
 * Configure store
 */
export const store = createStore(rootReducer, {
  middleware: [
    thunkMiddleware(),
    apiMiddleware,
    sagaMiddleware,
    loggerMiddleware(),
  ],
  devTools: process.env.NODE_ENV !== "production",
  debug: process.env.NODE_ENV !== "production",
});

/**
 * Run root saga
 */
sagaMiddleware.run(rootSaga);

/**
 * Export types
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`;
}

/**
 * Store types template
 */
export function storeTypesTemplate(): string {
  return `/**
 * Store Types
 */

import type { store } from "./store";

/**
 * Root state type
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * App dispatch type
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed hooks helpers
 */
export type StateSelector<T> = (state: RootState) => T;
`;
}

/**
 * Root reducer template
 */
export function rootReducerTemplate(): string {
  return `/**
 * Root Reducer
 * Combine all slice reducers
 */

import { combineReducers } from "synapse-state";

// Import slice reducers here
// import { exampleReducer } from "./slices/example";

/**
 * Root reducer
 */
export const rootReducer = combineReducers({
  // Add your reducers here
  // example: exampleReducer,
});
`;
}

/**
 * Root saga template
 */
export function rootSagaTemplate(): string {
  return `/**
 * Root Saga
 * Combine all slice sagas
 */

import { all } from "synapse-state";
import type { Effect } from "synapse-state";

// Import slice sagas here
// import { exampleSaga } from "./slices/example";

/**
 * Root saga
 */
export function* rootSaga(): Generator<Effect, void, unknown> {
  yield all([
    // Add your sagas here
    // exampleSaga(),
  ]);
}
`;
}

