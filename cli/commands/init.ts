/**
 * Synapse CLI - Init Command
 * Initialize configuration file
 */

import * as fs from "fs";
import * as path from "path";

interface InitOptions {
  path: string;
  force: boolean;
}

const defaultConfig = {
  storePath: "./src/store",
  slicesPath: "./src/store/slices",
  actionType: {
    case: "UPPER_SNAKE",
    prefix: "",
    suffix: ""
  },
  dispatch: {
    startAction: false,
    endAction: false,
    startSuffix: "_START",
    endSuffix: "_END"
  },
  debug: {
    enabled: false,
    logger: false,
    devtools: true,
    logLevel: "info"
  },
  api: {
    baseURL: "",
    timeout: 30000,
    headers: {},
    retry: {
      enabled: false,
      maxAttempts: 3,
      delay: 1000
    }
  }
};

export function initCommand(options: InitOptions): void {
  const configPath = path.resolve(process.cwd(), options.path);
  
  console.log("🧠 Synapse - Initializing configuration...\n");

  // Check if file exists
  if (fs.existsSync(configPath) && !options.force) {
    console.error(`❌ Config file already exists at: ${configPath}`);
    console.log("   Use --force to overwrite existing config.\n");
    process.exit(1);
  }

  try {
    // Write config file
    fs.writeFileSync(
      configPath,
      JSON.stringify(defaultConfig, null, 2),
      "utf-8"
    );

    console.log(`✅ Created config file: ${configPath}\n`);
    console.log("📁 Default configuration:");
    console.log(`   Store path: ${defaultConfig.storePath}`);
    console.log(`   Slices path: ${defaultConfig.slicesPath}`);
    console.log(`   Action case: ${defaultConfig.actionType.case}`);
    console.log(`   Debug mode: ${defaultConfig.debug.enabled ? "enabled" : "disabled"}`);
    console.log("\n💡 Next steps:");
    console.log("   1. Edit synapse.config.json to customize your setup");
    console.log("   2. Run 'synapse generate store' to create store files");
    console.log("   3. Run 'synapse slice <name>' to create a new slice\n");
    
  } catch (error) {
    console.error("❌ Failed to create config file:", error);
    process.exit(1);
  }
}

