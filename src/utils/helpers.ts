/**
 * Synapse - Helper Utilities
 * Common utility functions
 */

import { ActionCase } from "@types/action.types";

/**
 * Check if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

/**
 * Check if value is a promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise || (
    isPlainObject(value) && 
    isFunction((value as Record<string, unknown>).then) && 
    isFunction((value as Record<string, unknown>).catch)
  );
}

/**
 * Check if value is a generator
 */
export function isGenerator(value: unknown): value is Generator {
  return (
    value !== null &&
    typeof value === "object" &&
    isFunction((value as Generator).next) &&
    isFunction((value as Generator).throw)
  );
}

/**
 * Check if value is a generator function
 */
export function isGeneratorFunction(value: unknown): value is GeneratorFunction {
  if (!isFunction(value)) return false;
  const constructor = value.constructor;
  if (!constructor) return false;
  return (
    constructor.name === "GeneratorFunction" ||
    constructor.displayName === "GeneratorFunction"
  );
}

/**
 * Deep freeze an object
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (
      value !== null &&
      (typeof value === "object" || typeof value === "function") &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value as object);
    }
  });
  return obj;
}

/**
 * Shallow compare two values
 */
export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  
  if (
    typeof a !== "object" || a === null ||
    typeof b !== "object" || b === null
  ) {
    return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    ) {
      return false;
    }
  }
  
  return true;
}

/**
 * Convert string to specific case
 */
export function convertCase(str: string, caseType: ActionCase): string {
  // First normalize to words
  const words = str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  
  switch (caseType) {
    case ActionCase.UPPER_SNAKE:
      return words.join("_").toUpperCase();
    case ActionCase.LOWER_SNAKE:
      return words.join("_").toLowerCase();
    case ActionCase.CAMEL_CASE:
      return words
        .map((word, index) => 
          index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join("");
    case ActionCase.KEBAB_CASE:
      return words.join("-").toLowerCase();
    default:
      return str;
  }
}

/**
 * Generate unique ID
 */
let idCounter = 0;
export function generateId(prefix: string = "synapse"): string {
  return `${prefix}_${++idCounter}_${Date.now().toString(36)}`;
}

/**
 * Compose functions from right to left
 */
export function compose<T>(...funcs: Array<(arg: T) => T>): (arg: T) => T {
  if (funcs.length === 0) {
    return (arg: T) => arg;
  }
  
  if (funcs.length === 1) {
    return funcs[0];
  }
  
  return funcs.reduce((a, b) => (arg: T) => a(b(arg)));
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  const cloned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  
  return cloned as T;
}

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue<T = unknown>(
  obj: Record<string, unknown>,
  path: string
): T | undefined {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj) as T | undefined;
}

/**
 * Set nested value in object using dot notation
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split(".");
  const lastKey = keys.pop()!;
  const target = keys.reduce<Record<string, unknown>>((acc, key) => {
    if (!(key in acc) || typeof acc[key] !== "object") {
      acc[key] = {};
    }
    return acc[key] as Record<string, unknown>;
  }, obj);
  
  target[lastKey] = value;
  return obj;
}

