/**
 * Synapse CLI - Generate Command
 * Generate slices, stores, and related files
 */

import * as fs from "fs";
import * as path from "path";
import {
  sliceTemplate,
  sliceTypesTemplate,
  sliceApiTemplate,
  sliceSagaTemplate,
  storeTemplate,
  storeTypesTemplate,
  rootReducerTemplate,
  rootSagaTemplate,
} from "../templates/slice.template";

interface GenerateOptions {
  path?: string;
  api?: boolean;
  saga?: boolean;
  types?: boolean;
}

interface Config {
  storePath: string;
  slicesPath: string;
  actionType: {
    case: string;
  };
}

function loadConfig(): Config {
  const configPath = path.resolve(process.cwd(), "synapse.config.json");
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  }
  
  return {
    storePath: "./src/store",
    slicesPath: "./src/store/slices",
    actionType: {
      case: "UPPER_SNAKE"
    }
  };
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(str: string, upper: boolean = false): string {
  const snake = str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[-\s]/g, "_")
    .toLowerCase();
  return upper ? snake.toUpperCase() : snake;
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`   📁 Created directory: ${dirPath}`);
  }
}

function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`   ✅ Created: ${filePath}`);
}

export function generateCommand(
  type: string,
  name: string,
  options: GenerateOptions
): void {
  const config = loadConfig();
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const snakeName = toSnakeCase(name, config.actionType.case === "UPPER_SNAKE");

  console.log(`\n🧠 Synapse - Generating ${type}: ${name}\n`);

  switch (type) {
    case "slice":
      generateSlice(name, pascalName, camelName, snakeName, config, options);
      break;
    case "store":
      generateStore(config, options);
      break;
    case "api":
      generateApiFile(name, pascalName, camelName, snakeName, config, options);
      break;
    case "saga":
      generateSagaFile(name, pascalName, camelName, snakeName, config, options);
      break;
    default:
      console.error(`❌ Unknown type: ${type}`);
      console.log("   Available types: slice, store, api, saga");
      process.exit(1);
  }

  console.log("\n✨ Generation complete!\n");
}

function generateSlice(
  name: string,
  pascalName: string,
  camelName: string,
  snakeName: string,
  config: Config,
  options: GenerateOptions
): void {
  const slicePath = options.path || path.join(config.slicesPath, name);
  const fullPath = path.resolve(process.cwd(), slicePath);

  // Create slice directory
  ensureDir(fullPath);

  // Generate slice file
  const sliceContent = sliceTemplate(pascalName, camelName, snakeName);
  writeFile(path.join(fullPath, `${name}.slice.ts`), sliceContent);

  // Generate types file
  if (options.types !== false) {
    const typesContent = sliceTypesTemplate(pascalName, camelName);
    writeFile(path.join(fullPath, `${name}.types.ts`), typesContent);
  }

  // Generate API file
  if (options.api !== false) {
    const apiContent = sliceApiTemplate(pascalName, camelName, snakeName);
    writeFile(path.join(fullPath, `${name}.api.ts`), apiContent);
  }

  // Generate saga file
  if (options.saga !== false) {
    const sagaContent = sliceSagaTemplate(pascalName, camelName, snakeName);
    writeFile(path.join(fullPath, `${name}.saga.ts`), sagaContent);
  }

  // Generate index file
  const indexContent = generateSliceIndex(name, options);
  writeFile(path.join(fullPath, "index.ts"), indexContent);
}

function generateSliceIndex(name: string, options: GenerateOptions): string {
  const exports = [
    `export * from "./${name}.slice";`,
    options.types !== false ? `export * from "./${name}.types";` : null,
    options.api !== false ? `export * from "./${name}.api";` : null,
    options.saga !== false ? `export * from "./${name}.saga";` : null,
  ].filter(Boolean);

  return `/**
 * ${toPascalCase(name)} Slice Index
 */

${exports.join("\n")}
`;
}

function generateStore(config: Config, options: GenerateOptions): void {
  const storePath = options.path || config.storePath;
  const fullPath = path.resolve(process.cwd(), storePath);

  // Create store directory
  ensureDir(fullPath);

  // Generate store file
  const storeContent = storeTemplate();
  writeFile(path.join(fullPath, "store.ts"), storeContent);

  // Generate types file
  const typesContent = storeTypesTemplate();
  writeFile(path.join(fullPath, "store.types.ts"), typesContent);

  // Generate root reducer
  const reducerContent = rootReducerTemplate();
  writeFile(path.join(fullPath, "rootReducer.ts"), reducerContent);

  // Generate root saga
  const sagaContent = rootSagaTemplate();
  writeFile(path.join(fullPath, "rootSaga.ts"), sagaContent);

  // Generate index file
  const indexContent = `/**
 * Store Index
 */

export { store } from "./store";
export type { RootState, AppDispatch } from "./store.types";
export { rootReducer } from "./rootReducer";
export { rootSaga } from "./rootSaga";
`;
  writeFile(path.join(fullPath, "index.ts"), indexContent);

  // Create slices directory
  const slicesPath = path.resolve(process.cwd(), config.slicesPath);
  ensureDir(slicesPath);

  // Create slices index
  const slicesIndexContent = `/**
 * Slices Index
 * Export all slices here
 */

// Example:
// export * from "./example";
`;
  writeFile(path.join(slicesPath, "index.ts"), slicesIndexContent);
}

function generateApiFile(
  name: string,
  pascalName: string,
  camelName: string,
  snakeName: string,
  config: Config,
  options: GenerateOptions
): void {
  const slicePath = options.path || path.join(config.slicesPath, name);
  const fullPath = path.resolve(process.cwd(), slicePath);

  ensureDir(fullPath);

  const apiContent = sliceApiTemplate(pascalName, camelName, snakeName);
  writeFile(path.join(fullPath, `${name}.api.ts`), apiContent);
}

function generateSagaFile(
  name: string,
  pascalName: string,
  camelName: string,
  snakeName: string,
  config: Config,
  options: GenerateOptions
): void {
  const slicePath = options.path || path.join(config.slicesPath, name);
  const fullPath = path.resolve(process.cwd(), slicePath);

  ensureDir(fullPath);

  const sagaContent = sliceSagaTemplate(pascalName, camelName, snakeName);
  writeFile(path.join(fullPath, `${name}.saga.ts`), sagaContent);
}

