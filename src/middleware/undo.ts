import type { Middleware, SetState } from '../types';

export interface UndoOptions {
  limit?: number;
  exclude?: string[];
}

export interface UndoState {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

export function undo<T extends object>(options: UndoOptions = {}): Middleware<T & UndoState> {
  const { limit = 50, exclude = [] } = options;

  return ({ initialState }) => {
    let past: Partial<T>[] = [];
    let future: Partial<T>[] = [];
    let currentState = filterState(initialState, exclude);

    function filterState(state: T, excludeKeys: string[]): Partial<T> {
      const filtered: Partial<T> = {};
      for (const key of Object.keys(state) as (keyof T)[]) {
        if (!excludeKeys.includes(key as string) && typeof state[key] !== 'function') {
          filtered[key] = state[key];
        }
      }
      return filtered;
    }

    return (next: SetState<T & UndoState>, get, nucleus) => {
      const enhancedSet: SetState<T & UndoState> = (partial, replace) => {
        const prevState = get();
        const prevFiltered = filterState(prevState as T, exclude);

        next(partial, replace);

        const nextState = get();
        const nextFiltered = filterState(nextState as T, exclude);

        if (JSON.stringify(prevFiltered) !== JSON.stringify(nextFiltered)) {
          past = [...past.slice(-(limit - 1)), prevFiltered];
          future = [];
          
          next({
            canUndo: past.length > 0,
            canRedo: false,
          } as Partial<T & UndoState>, false);
        }

        currentState = nextFiltered;
      };

      const undoAction = () => {
        if (past.length === 0) return;

        const previous = past[past.length - 1];
        past = past.slice(0, -1);
        future = [currentState, ...future];

        next({
          ...previous,
          canUndo: past.length > 0,
          canRedo: true,
        } as Partial<T & UndoState>, false);

        currentState = previous;
      };

      const redoAction = () => {
        if (future.length === 0) return;

        const nextState = future[0];
        future = future.slice(1);
        past = [...past, currentState];

        next({
          ...nextState,
          canUndo: true,
          canRedo: future.length > 0,
        } as Partial<T & UndoState>, false);

        currentState = nextState;
      };

      const clearHistory = () => {
        past = [];
        future = [];
        next({
          canUndo: false,
          canRedo: false,
        } as Partial<T & UndoState>, false);
      };

      setTimeout(() => {
        next({
          undo: undoAction,
          redo: redoAction,
          canUndo: false,
          canRedo: false,
          clearHistory,
        } as Partial<T & UndoState>, false);
      }, 0);

      return enhancedSet;
    };
  };
}

