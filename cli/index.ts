#!/usr/bin/env node
/**
 * Synapse CLI
 * Generate slices, stores, and manage configuration
 */

import { Command } from "commander";
import { initCommand } from "./commands/init";
import { generateCommand } from "./commands/generate";

const program = new Command();

program
  .name("synapse")
  .description("Synapse - A thin state management library CLI")
  .version("1.0.0");

// Init command
program
  .command("init")
  .description("Initialize Synapse configuration")
  .option("-p, --path <path>", "Config file path", "./synapse.config.json")
  .option("-f, --force", "Overwrite existing config", false)
  .action(initCommand);

// Generate command
program
  .command("generate <type> <name>")
  .alias("g")
  .description("Generate slice, api, or saga files")
  .option("-p, --path <path>", "Output path")
  .option("--no-api", "Skip API file generation")
  .option("--no-saga", "Skip saga file generation")
  .option("--no-types", "Skip types file generation")
  .action(generateCommand);

// Slice shortcut
program
  .command("slice <name>")
  .description("Generate a new slice (shortcut for: generate slice <name>)")
  .option("-p, --path <path>", "Output path")
  .option("--no-api", "Skip API file generation")
  .option("--no-saga", "Skip saga file generation")
  .action((name, options) => {
    generateCommand("slice", name, options);
  });

// Store shortcut
program
  .command("store")
  .description("Generate store configuration")
  .option("-p, --path <path>", "Output path")
  .action((options) => {
    generateCommand("store", "store", options);
  });

program.parse();

