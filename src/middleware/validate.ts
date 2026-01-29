import type { Middleware, SetState } from '../types';

export interface ZodLikeSchema<T> {
  safeParse: (data: unknown) => { success: boolean; data?: T; error?: { errors: Array<{ message: string; path: (string | number)[] }> } };
}

export interface ValidateOptions<T> {
  schema: ZodLikeSchema<T>;
  mode?: 'reject' | 'warn' | 'fix';
  onError?: (error: { errors: Array<{ message: string; path: (string | number)[] }> }, invalidState: unknown) => void;
}

export function validate<T extends object>(options: ValidateOptions<T>): Middleware<T> {
  const { schema, mode = 'reject', onError } = options;

  return () => {
    return (next: SetState<T>, get) => {
      const enhancedSet: SetState<T> = (partial, replace) => {
        const currentState = get();
        const update = typeof partial === 'function' ? partial(currentState) : partial;
        
        const nextState = replace ? update : { ...currentState, ...update };
        
        const dataToValidate: Record<string, unknown> = {};
        for (const key of Object.keys(nextState as object)) {
          const value = (nextState as Record<string, unknown>)[key];
          if (typeof value !== 'function') {
            dataToValidate[key] = value;
          }
        }
        
        const result = schema.safeParse(dataToValidate);
        
        if (!result.success) {
          if (onError && result.error) {
            onError(result.error, nextState);
          }
          
          switch (mode) {
            case 'reject':
              console.error('[Synapse validate] Invalid state rejected:', result.error?.errors);
              return;
            case 'warn':
              console.warn('[Synapse validate] Invalid state:', result.error?.errors);
              next(partial, replace);
              return;
            case 'fix':
              if (result.data) {
                next(result.data as Partial<T>, replace);
              }
              return;
          }
        }
        
        next(partial, replace);
      };

      return enhancedSet;
    };
  };
}

