/**
 * Synapse - Config Types
 * Type definitions for configuration
 */

import { ActionCase } from "./action.types";

/**
 * Action type configuration
 */
export interface ActionTypeConfig {
  /** Case style for action types */
  case: ActionCase;
  
  /** Prefix for action types */
  prefix?: string;
  
  /** Suffix for action types */
  suffix?: string;
}

/**
 * Dispatch configuration
 */
export interface DispatchConfig {
  /** Whether to dispatch start action */
  startAction: boolean;
  
  /** Whether to dispatch end action */
  endAction: boolean;
  
  /** Custom start action suffix */
  startSuffix?: string;
  
  /** Custom end action suffix */
  endSuffix?: string;
}

/**
 * Debug configuration
 */
export interface DebugConfig {
  /** Enable debug mode */
  enabled: boolean;
  
  /** Enable logger */
  logger: boolean;
  
  /** Enable DevTools integration */
  devtools: boolean;
  
  /** Log level */
  logLevel?: "info" | "warn" | "error" | "debug";
}

/**
 * API configuration
 */
export interface ApiConfig {
  /** Base URL for API requests */
  baseURL: string;
  
  /** Default timeout in milliseconds */
  timeout: number;
  
  /** Default headers */
  headers?: Record<string, string>;
  
  /** Retry configuration */
  retry?: {
    enabled: boolean;
    maxAttempts: number;
    delay: number;
  };
}

/**
 * CLI configuration
 */
export interface CliConfig {
  /** Path for slices */
  slicesPath: string;
  
  /** Path for store */
  storePath: string;
  
  /** Path for API files */
  apiPath?: string;
  
  /** Path for saga files */
  sagaPath?: string;
}

/**
 * Main Synapse configuration
 */
export interface SynapseConfig {
  /** Store path */
  storePath: string;
  
  /** Slices path */
  slicesPath: string;
  
  /** Action type configuration */
  actionType: ActionTypeConfig;
  
  /** Dispatch configuration */
  dispatch: DispatchConfig;
  
  /** Debug configuration */
  debug: DebugConfig;
  
  /** API configuration */
  api: ApiConfig;
  
  /** CLI configuration */
  cli?: CliConfig;
}

/**
 * Partial config for user overrides
 */
export type PartialSynapseConfig = Partial<{
  [K in keyof SynapseConfig]: Partial<SynapseConfig[K]>;
}>;

