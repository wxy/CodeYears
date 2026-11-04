import { parseArgs } from "node:util";
import { cp } from "node:fs/promises";
import { resolve } from "node:path";
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
    target: "es2022", outDir: values.outDir, emptyOutDir: false, watch,
    lib: { entry: "src/extension/entry.ts", name: "CodeYearsEntry", formats: ["iife"], fileName: () => "entry.js" },
  },
});
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
      formats: ["es"],
      fileName: () => "content.js",
    },
  },
});
await build({
  configFile: false,
  publicDir: false,
  build: {
    target: "es2022", outDir: values.outDir, emptyOutDir: false, watch,
    lib: { entry: "src/renderers/landscape.ts", formats: ["es"], fileName: () => "landscape.js" },
    rollupOptions: { output: { chunkFileNames: "chunks/[name]-[hash].js" } },
  },
});

// 设计源图留在public供素材生成器使用，发行目录只复制预烘焙运行图。
for (const name of ['manifest.json', '_locales', 'icons']) {
  await cp(resolve('public', name), resolve(values.outDir, name), { recursive: true });
}
await cp(resolve('public/assets/city-runtime'), resolve(values.outDir, 'assets/city'), { recursive: true });
