import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export default defineConfig(({ command, isPreview }) => {
  const { values } = parseArgs({ options: { outDir: { type: "string" } }, strict: false, allowPositionals: true });
  const outDir = typeof values.outDir === "string" ? values.outDir : undefined;
  if ((command === "build" || isPreview) && !outDir) {
    throw new Error("请先用 mktemp -d 创建本轮临时目录，再通过 --outDir 指定构建输出；参见 docs/tasks/TIME-TRAVEL-PROBE.md。");
  }
  return {
    root: fileURLToPath(new URL(".", import.meta.url)),
    publicDir: false,
    server: { host: "127.0.0.1" },
    build: { outDir, emptyOutDir: false },
  };
});
