import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export default defineConfig(({ command, isPreview }) => {
  const { values } = parseArgs({ options: { outDir: { type: "string" } }, strict: false, allowPositionals: true });
  const outDir = typeof values.outDir === "string" ? values.outDir : undefined;
  if ((command === "build" || isPreview) && !outDir) throw new Error("构建预览时请用 --outDir 指定本轮临时目录。");
  return { root: fileURLToPath(new URL(".", import.meta.url)), publicDir: false, server: { host: "127.0.0.1", port: 4175, strictPort: true }, build: { outDir, emptyOutDir: false } };
});
