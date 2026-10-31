import { parseArgs } from "node:util";
import { build } from "vite";

const { values } = parseArgs({
  options: { outDir: { type: "string", default: "dist" }, watch: { type: "boolean" } },
});
const watch = values.watch ? {} : null;

await build({ build: { outDir: values.outDir, watch, ...(values.watch ? { emptyOutDir: false } : {}) } });
await build({
  configFile: false,
  publicDir: false,
  build: {
    target: "es2022",
    outDir: values.outDir,
    emptyOutDir: false,
    watch,
    lib: {
      entry: "src/extension/content.ts",
      name: "CodeYearsDataProbe",
      formats: ["iife"],
      fileName: () => "content.js",
    },
  },
});
await build({
  configFile: false,
  publicDir: false,
  build: {
    target: "es2022", outDir: values.outDir, emptyOutDir: false, watch,
    lib: { entry: "src/renderers/city-preview.ts", formats: ["es"], fileName: () => "city-preview.js" },
  },
});
