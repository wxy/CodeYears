import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: false,
  build: {
    target: "es2022",
    rolldownOptions: {
      input: "popup.html",
      output: { chunkFileNames: "assets/shared-[hash].js" },
    },
  },
});
