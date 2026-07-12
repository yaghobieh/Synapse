import type { Middleware } from '../types';

export function composeMiddleware<T extends object>(
  ...middlewares: Middleware<T>[]
): Middleware<T> {
  return (config) => (set, get, nucleus) =>
    middlewares.reduceRight(
      (acc, middleware) => middleware(config)(acc, get, nucleus),
      set,
    );
}
