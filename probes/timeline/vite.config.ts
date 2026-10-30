import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// Builds must pass an explicit, per-run temporary --outDir.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: false,
  server: { host: "127.0.0.1" },
  build: { emptyOutDir: false },
});
