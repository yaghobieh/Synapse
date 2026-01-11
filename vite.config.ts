import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import dts from "vite-plugin-dts";

const projectRootDir = resolve(__dirname);

export default defineConfig(({ mode }) => {
  // Development mode - serve demo app
  if (mode === 'development') {
    return {
      root: ".",
      publicDir: "public",
      server: {
        host: true,
        port: 5173,
      },
      resolve: {
        alias: [
          { find: "@consts", replacement: resolve(projectRootDir, "src/consts") },
          { find: "@core", replacement: resolve(projectRootDir, "src/core") },
          { find: "@hooks", replacement: resolve(projectRootDir, "src/hooks") },
          { find: "@api", replacement: resolve(projectRootDir, "src/api") },
          { find: "@utils", replacement: resolve(projectRootDir, "src/utils") },
          { find: "@config", replacement: resolve(projectRootDir, "src/config") },
          { find: "@types", replacement: resolve(projectRootDir, "src/types") },
          { find: "@example", replacement: resolve(projectRootDir, "src/example") }
        ],
      },
      plugins: [
        react(),
      ],
    };
  }

  // Production build - build library
  return {
    build: {
      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        name: "synapse",
        formats: ["es", "umd"],
        fileName: (format) => `index.${format}.js`,
      },
      minify: true,
      sourcemap: true,
      emptyOutDir: true,
      rollupOptions: {
        external: [
          "react",
          "react-dom",
          "axios"
        ],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
            axios: "axios"
          },
        },
      },
    },
    resolve: {
      alias: [
        { find: "@consts", replacement: resolve(projectRootDir, "src/consts") },
        { find: "@core", replacement: resolve(projectRootDir, "src/core") },
        { find: "@hooks", replacement: resolve(projectRootDir, "src/hooks") },
        { find: "@api", replacement: resolve(projectRootDir, "src/api") },
        { find: "@utils", replacement: resolve(projectRootDir, "src/utils") },
        { find: "@config", replacement: resolve(projectRootDir, "src/config") },
        { find: "@types", replacement: resolve(projectRootDir, "src/types") },
        { find: "@example", replacement: resolve(projectRootDir, "src/example") }
      ],
    },
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
        outputDir: "dist",
        tsconfigPath: "./tsconfig.types.json",
        skipDiagnostics: false
      })
    ],
  };
});

