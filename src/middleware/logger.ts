/**
 * Logger Middleware - Log state changes
 */

import type { Middleware, LoggerOptions, SetState } from '../types';

/**
 * Logger middleware for debugging state changes
 * 
 * @example
 * ```ts
 * const nucleus = createNucleus(
 *   (set) => ({ count: 0 }),
 *   { middleware: [logger({ diff: true, timestamp: true })] }
 * );
 * ```
 */
export function logger<T extends object>(
  options: LoggerOptions = {}
): Middleware<T> {
  const {
    actions = true,
    diff = false,
    timestamp = true,
    logger: customLogger = console.log,
  } = options;
  
  return () => (set, get) => {
    return ((partial, replace) => {
      const prevState = get();
      
      // Call original set
      set(partial, replace);
      
      const nextState = get();
      
      // Build log message
      const time = timestamp ? new Date().toISOString() : '';
      const actionName = typeof partial === 'function' 
        ? 'Function Update' 
        : 'State Update';
      
      if (actions) {
        const prefix = timestamp ? `[${time}]` : '';
        customLogger(`${prefix} Synapse: ${actionName}`);
      }
      
      if (diff) {
        customLogger('  Previous:', prevState);
        customLogger('  Next:', nextState);
        customLogger('  Changes:', partial);
      }
    }) as SetState<T>;
  };
}

