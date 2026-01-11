/**
 * Synapse - Create Slice
 * Create a reducer slice with actions
 */

import type { Action, AnyAction, CaseReducer, PayloadAction, Reducer } from "@types/action.types";
import type { Slice, SliceConfig } from "@types/store.types";
import { convertCase } from "@utils/helpers";
import { ActionCase } from "@types/action.types";
import { getConfig } from "@config/configLoader";

/**
 * Prepare action creator result
 */
interface PrepareAction<P> {
  payload: P;
  meta?: Record<string, unknown>;
  error?: boolean;
}

/**
 * Action creator with prepare
 */
interface ActionCreatorWithPrepare<P, T extends string> {
  (payload: P): PayloadAction<P, T>;
  type: T;
  match: (action: Action) => action is PayloadAction<P, T>;
}

/**
 * Reducer with optional prepare
 */
type SliceReducer<S, P = unknown> = 
  | CaseReducer<S, PayloadAction<P>>
  | {
      reducer: CaseReducer<S, PayloadAction<P>>;
      prepare: (...args: unknown[]) => PrepareAction<P>;
    };

/**
 * Slice reducers map
 */
type SliceReducers<S> = Record<string, SliceReducer<S>>;

/**
 * Create action type string
 */
function createActionType(sliceName: string, actionName: string): string {
  const config = getConfig();
  const caseStyle = config?.actionType?.case ?? ActionCase.UPPER_SNAKE;
  const prefix = config?.actionType?.prefix ?? "";
  const suffix = config?.actionType?.suffix ?? "";
  
  const baseType = `${sliceName}/${actionName}`;
  const convertedType = convertCase(baseType, caseStyle);
  
  return `${prefix}${convertedType}${suffix}`;
}

/**
 * Create action creator
 */
function createActionCreator<P = void, T extends string = string>(
  type: T
): ActionCreatorWithPrepare<P, T> {
  const actionCreator = (payload: P): PayloadAction<P, T> => ({
    type,
    payload,
  });

  actionCreator.type = type;
  actionCreator.match = (action: Action): action is PayloadAction<P, T> => {
    return action.type === type;
  };

  return actionCreator as ActionCreatorWithPrepare<P, T>;
}

/**
 * Create a slice with reducer and actions
 */
export function createSlice<
  S,
  R extends SliceReducers<S> = SliceReducers<S>
>(config: {
  name: string;
  initialState: S;
  reducers: R;
  extraReducers?: (builder: {
    addCase: <A extends Action>(
      actionCreator: { type: string } | string,
      reducer: CaseReducer<S, A>
    ) => void;
    addMatcher: (
      matcher: (action: AnyAction) => boolean,
      reducer: CaseReducer<S, AnyAction>
    ) => void;
    addDefaultCase: (reducer: CaseReducer<S, AnyAction>) => void;
  }) => void;
}): Slice<S, PayloadAction> {
  const { name, initialState, reducers, extraReducers } = config;

  // Build action creators
  const actions: Record<string, ActionCreatorWithPrepare<unknown, string>> = {};
  const caseReducers: Record<string, CaseReducer<S, PayloadAction>> = {};

  for (const [key, value] of Object.entries(reducers)) {
    const actionType = createActionType(name, key);
    
    if (typeof value === "function") {
      caseReducers[actionType] = value as CaseReducer<S, PayloadAction>;
      actions[key] = createActionCreator(actionType);
    } else if (value && typeof value === "object" && "reducer" in value) {
      caseReducers[actionType] = value.reducer;
      const prepare = value.prepare;
      
      const actionCreator = (...args: unknown[]): PayloadAction => {
        const prepared = prepare(...args);
        return {
          type: actionType,
          payload: prepared.payload,
          ...(prepared.meta && { meta: prepared.meta }),
          ...(prepared.error && { error: prepared.error }),
        };
      };
      actionCreator.type = actionType;
      actionCreator.match = (action: Action): action is PayloadAction => {
        return action.type === actionType;
      };
      
      actions[key] = actionCreator as ActionCreatorWithPrepare<unknown, string>;
    }
  }

  // Handle extra reducers
  const extraCaseReducers: Record<string, CaseReducer<S, AnyAction>> = {};
  const matchers: Array<{
    matcher: (action: AnyAction) => boolean;
    reducer: CaseReducer<S, AnyAction>;
  }> = [];
  let defaultCaseReducer: CaseReducer<S, AnyAction> | undefined;

  if (extraReducers) {
    const builder = {
      addCase: <A extends Action>(
        actionCreator: { type: string } | string,
        reducer: CaseReducer<S, A>
      ): void => {
        const type = typeof actionCreator === "string" 
          ? actionCreator 
          : actionCreator.type;
        extraCaseReducers[type] = reducer as CaseReducer<S, AnyAction>;
      },
      addMatcher: (
        matcher: (action: AnyAction) => boolean,
        reducer: CaseReducer<S, AnyAction>
      ): void => {
        matchers.push({ matcher, reducer });
      },
      addDefaultCase: (reducer: CaseReducer<S, AnyAction>): void => {
        defaultCaseReducer = reducer;
      },
    };
    
    extraReducers(builder);
  }

  // Create reducer function
  const reducer: Reducer<S, PayloadAction> = (
    state: S | undefined = initialState,
    action: PayloadAction
  ): S => {
    // Check case reducers
    let caseReducer = caseReducers[action.type];
    
    if (!caseReducer) {
      caseReducer = extraCaseReducers[action.type];
    }

    if (caseReducer) {
      const result = caseReducer(state, action);
      return result === undefined ? state : result;
    }

    // Check matchers
    for (const { matcher, reducer: matchReducer } of matchers) {
      if (matcher(action)) {
        const result = matchReducer(state, action);
        return result === undefined ? state : result;
      }
    }

    // Default case
    if (defaultCaseReducer) {
      const result = defaultCaseReducer(state, action);
      return result === undefined ? state : result;
    }

    return state;
  };

  return {
    name,
    reducer,
    actions: actions as Slice<S, PayloadAction>["actions"],
    getInitialState: () => initialState,
  };
}

/**
 * Create async thunk action
 */
export function createAsyncThunk<Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: (
    arg: ThunkArg,
    thunkAPI: {
      dispatch: (action: AnyAction) => AnyAction;
      getState: () => unknown;
      rejectWithValue: (value: unknown) => { payload: unknown; error: true };
    }
  ) => Promise<Returned>
): {
  (arg: ThunkArg): (dispatch: (action: AnyAction) => AnyAction, getState: () => unknown) => Promise<Returned | { payload: unknown; error: true }>;
  pending: { type: string };
  fulfilled: { type: string };
  rejected: { type: string };
} {
  const pending = `${typePrefix}/pending`;
  const fulfilled = `${typePrefix}/fulfilled`;
  const rejected = `${typePrefix}/rejected`;

  const actionCreator = (arg: ThunkArg) => {
    return async (
      dispatch: (action: AnyAction) => AnyAction,
      getState: () => unknown
    ): Promise<Returned | { payload: unknown; error: true }> => {
      dispatch({ type: pending, payload: arg });

      let rejectValue: unknown;
      const rejectWithValue = (value: unknown) => {
        rejectValue = value;
        return { payload: value, error: true as const };
      };

      try {
        const result = await payloadCreator(arg, {
          dispatch,
          getState,
          rejectWithValue,
        });

        if (rejectValue !== undefined) {
          dispatch({ type: rejected, payload: rejectValue, error: true });
          return { payload: rejectValue, error: true };
        }

        dispatch({ type: fulfilled, payload: result });
        return result;
      } catch (error) {
        dispatch({ 
          type: rejected, 
          payload: error instanceof Error ? error.message : error,
          error: true 
        });
        throw error;
      }
    };
  };

  actionCreator.pending = { type: pending };
  actionCreator.fulfilled = { type: fulfilled };
  actionCreator.rejected = { type: rejected };

  return actionCreator;
}

