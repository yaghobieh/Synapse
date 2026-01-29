/**
 * Naming convention utilities
 */

import type { NamingConvention } from '../types';

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^./, c => c.toLowerCase());
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^./, c => c.toUpperCase());
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Convert string to SCREAMING_SNAKE_CASE
 */
export function toScreamingSnakeCase(str: string): string {
  return toSnakeCase(str).toUpperCase();
}

/**
 * Apply naming convention to a string
 */
export function applyNaming(str: string, convention: NamingConvention): string {
  switch (convention) {
    case 'camelCase':
      return toCamelCase(str);
    case 'PascalCase':
      return toPascalCase(str);
    case 'snake_case':
      return toSnakeCase(str);
    case 'SCREAMING_SNAKE_CASE':
      return toScreamingSnakeCase(str);
    default:
      return str;
  }
}

