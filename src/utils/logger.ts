/**
 * Synapse - Logger Utility
 * Debug logging controlled by configuration
 */

import { LOG_PREFIX, LOG_PREFIX_DEBUG, LOG_PREFIX_ERROR, LOG_PREFIX_WARN } from "@consts/strings";
import type { DebugConfig } from "@types/config.types";

/**
 * Logger instance
 */
class SynapseLogger {
  private debugEnabled: boolean = false;
  private loggerEnabled: boolean = false;

  /**
   * Configure the logger
   */
  configure(config: Partial<DebugConfig>): void {
    this.debugEnabled = config.enabled ?? false;
    this.loggerEnabled = config.logger ?? false;
  }

  /**
   * Check if logging is enabled
   */
  private canLog(): boolean {
    return this.debugEnabled && this.loggerEnabled;
  }

  /**
   * Log info message
   */
  info(...args: unknown[]): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.log(LOG_PREFIX, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(...args: unknown[]): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.warn(LOG_PREFIX_WARN, ...args);
    }
  }

  /**
   * Log error message
   */
  error(...args: unknown[]): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.error(LOG_PREFIX_ERROR, ...args);
    }
  }

  /**
   * Log debug message
   */
  debug(...args: unknown[]): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.debug(LOG_PREFIX_DEBUG, ...args);
    }
  }

  /**
   * Log group
   */
  group(label: string): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.group(`${LOG_PREFIX} ${label}`);
    }
  }

  /**
   * Log collapsed group
   */
  groupCollapsed(label: string): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.groupCollapsed(`${LOG_PREFIX} ${label}`);
    }
  }

  /**
   * End group
   */
  groupEnd(): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  /**
   * Log table
   */
  table(data: unknown): void {
    if (this.canLog()) {
      // eslint-disable-next-line no-console
      console.table(data);
    }
  }

  /**
   * Log action dispatch
   */
  logAction(action: { type: string; payload?: unknown }, prevState: unknown, nextState: unknown): void {
    if (!this.canLog()) return;

    this.groupCollapsed(`Action: ${action.type}`);
    this.info("Previous State:", prevState);
    this.info("Action:", action);
    this.info("Next State:", nextState);
    this.groupEnd();
  }
}

/** Singleton logger instance */
export const logger = new SynapseLogger();

/**
 * Create a scoped logger
 */
export function createScopedLogger(scope: string): {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
} {
  return {
    info: (...args: unknown[]) => logger.info(`[${scope}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${scope}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${scope}]`, ...args),
    debug: (...args: unknown[]) => logger.debug(`[${scope}]`, ...args),
  };
}

