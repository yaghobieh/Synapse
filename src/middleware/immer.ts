/**
 * Immer-like Middleware - Mutable syntax for immutable updates
 * 
 * Note: This is a lightweight implementation without the full immer library.
 * For complex nested updates, consider using the actual immer library.
 */

import type { Middleware, SetState } from '../types';
import { deepClone } from '../utils/object';

/**
 * Enable mutable-style updates that are actually immutable
 * 
 * @example
 * ```ts
 * const userNucleus = createNucleus(
 *   (set) => ({
 *     user: { name: 'John', settings: { theme: 'dark' } },
 *     
 *     updateTheme: (theme: string) => set((draft) => {
 *       // Looks mutable, but creates immutable update
 *       draft.user.settings.theme = theme;
 *     }),
 *   }),
 *   { middleware: [immer()] }
 * );
 * ```
 */
export function immer<T extends object>(): Middleware<T> {
  return () => (set, get) => {
    return ((partial, replace) => {
      if (typeof partial === 'function') {
        // Clone state and let function mutate the clone
        const draft = deepClone(get());
        const result = (partial as (state: T) => Partial<T> | void)(draft);
        
        // If function returns a value, use it; otherwise use mutated draft
        if (result !== undefined) {
          set(result, replace);
        } else {
          set(draft as Partial<T>, true);
        }
      } else {
        // For object partials, just pass through
        set(partial, replace);
      }
    }) as SetState<T>;
  };
}

