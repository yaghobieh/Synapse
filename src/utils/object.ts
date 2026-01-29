/**
 * Object utilities for Synapse
 */

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Map) {
    const cloned = new Map();
    obj.forEach((value, key) => {
      cloned.set(deepClone(key), deepClone(value));
    });
    return cloned as T;
  }
  
  if (obj instanceof Set) {
    const cloned = new Set();
    obj.forEach(value => {
      cloned.add(deepClone(value));
    });
    return cloned as T;
  }
  
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      (cloned as Record<string, unknown>)[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  
  return cloned;
}

/**
 * Shallow merge two objects
 */
export function shallowMerge<T extends object>(target: T, source: Partial<T>): T {
  return { ...target, ...source };
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetValue = (target as Record<string, unknown>)[key];
      const sourceValue = (source as Record<string, unknown>)[key];
      
      if (
        typeof targetValue === 'object' &&
        targetValue !== null &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(targetValue) &&
        !Array.isArray(sourceValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as object,
          sourceValue as object
        );
      } else {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * Check if two values are deeply equal
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object' || a === null || b === null) {
    return a === b;
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => 
    deepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  );
}

/**
 * Get nested property by path
 */
export function getByPath(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current;
}

/**
 * Set nested property by path
 */
export function setByPath<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = deepClone(obj);
  let current: Record<string, unknown> = result as Record<string, unknown>;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  
  current[keys[keys.length - 1]] = value;
  return result;
}

