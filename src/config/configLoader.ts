/**
 * Synapse - Config Loader
 * Load and manage configuration
 */

import { 
  CONFIG_FILE_NAME, 
  DEFAULT_SLICES_PATH, 
  DEFAULT_STORE_PATH 
} from "@consts/strings";
import { DEFAULT_API_TIMEOUT } from "@consts/numbers";
import type { PartialSynapseConfig, SynapseConfig } from "@types/config.types";
import { ActionCase } from "@types/action.types";
import { logger } from "@utils/logger";

/**
 * Default configuration
 */
const defaultConfig: SynapseConfig = {
  storePath: DEFAULT_STORE_PATH,
  slicesPath: DEFAULT_SLICES_PATH,
  actionType: {
    case: ActionCase.UPPER_SNAKE,
    prefix: "",
    suffix: "",
  },
  dispatch: {
    startAction: false,
    endAction: false,
    startSuffix: "_START",
    endSuffix: "_END",
  },
  debug: {
    enabled: false,
    logger: false,
    devtools: true,
    logLevel: "info",
  },
  api: {
    baseURL: "",
    timeout: DEFAULT_API_TIMEOUT,
    headers: {},
    retry: {
      enabled: false,
      maxAttempts: 3,
      delay: 1000,
    },
  },
  cli: {
    slicesPath: DEFAULT_SLICES_PATH,
    storePath: DEFAULT_STORE_PATH,
  },
};

/**
 * Current configuration instance
 */
let currentConfig: SynapseConfig | null = null;

/**
 * Deep merge two objects
 */
function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== null &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue !== null &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Initialize configuration with user overrides
 */
export function initConfig(userConfig: PartialSynapseConfig = {}): SynapseConfig {
  currentConfig = deepMerge(defaultConfig, userConfig as Partial<SynapseConfig>);
  
  // Configure logger based on config
  logger.configure(currentConfig.debug);
  
  logger.info("Configuration initialized", currentConfig);
  
  return currentConfig;
}

/**
 * Get current configuration
 */
export function getConfig(): SynapseConfig | null {
  return currentConfig;
}

/**
 * Update configuration
 */
export function updateConfig(updates: PartialSynapseConfig): SynapseConfig {
  if (!currentConfig) {
    return initConfig(updates);
  }
  
  currentConfig = deepMerge(currentConfig, updates as Partial<SynapseConfig>);
  
  // Reconfigure logger
  logger.configure(currentConfig.debug);
  
  logger.info("Configuration updated", updates);
  
  return currentConfig;
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): SynapseConfig {
  currentConfig = { ...defaultConfig };
  logger.configure(currentConfig.debug);
  return currentConfig;
}

/**
 * Load configuration from file (for Node.js/CLI)
 */
export async function loadConfigFromFile(
  configPath?: string
): Promise<SynapseConfig> {
  const path = configPath || `./${CONFIG_FILE_NAME}`;
  
  try {
    // Dynamic import for file reading
    const fs = await import("fs").catch(() => null);
    const nodePath = await import("path").catch(() => null);
    
    if (!fs || !nodePath) {
      logger.warn("File system not available, using default config");
      return initConfig();
    }

    const fullPath = nodePath.resolve(process.cwd(), path);
    
    if (!fs.existsSync(fullPath)) {
      logger.info(`Config file not found at ${fullPath}, using defaults`);
      return initConfig();
    }

    const fileContent = fs.readFileSync(fullPath, "utf-8");
    const userConfig = JSON.parse(fileContent) as PartialSynapseConfig;
    
    return initConfig(userConfig);
  } catch (error) {
    logger.error("Failed to load config file:", error);
    return initConfig();
  }
}

/**
 * Save configuration to file (for Node.js/CLI)
 */
export async function saveConfigToFile(
  config: SynapseConfig,
  configPath?: string
): Promise<void> {
  const path = configPath || `./${CONFIG_FILE_NAME}`;
  
  try {
    const fs = await import("fs").catch(() => null);
    const nodePath = await import("path").catch(() => null);
    
    if (!fs || !nodePath) {
      logger.warn("File system not available, cannot save config");
      return;
    }

    const fullPath = nodePath.resolve(process.cwd(), path);
    const content = JSON.stringify(config, null, 2);
    
    fs.writeFileSync(fullPath, content, "utf-8");
    logger.info(`Configuration saved to ${fullPath}`);
  } catch (error) {
    logger.error("Failed to save config file:", error);
    throw error;
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: PartialSynapseConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate action type case
  if (config.actionType?.case) {
    const validCases = Object.values(ActionCase);
    if (!validCases.includes(config.actionType.case)) {
      errors.push(
        `Invalid actionType.case: "${config.actionType.case}". ` +
        `Valid options: ${validCases.join(", ")}`
      );
    }
  }

  // Validate API timeout
  if (config.api?.timeout !== undefined && config.api.timeout < 0) {
    errors.push("api.timeout must be a positive number");
  }

  // Validate debug log level
  if (config.debug?.logLevel) {
    const validLevels = ["info", "warn", "error", "debug"];
    if (!validLevels.includes(config.debug.logLevel)) {
      errors.push(
        `Invalid debug.logLevel: "${config.debug.logLevel}". ` +
        `Valid options: ${validLevels.join(", ")}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

