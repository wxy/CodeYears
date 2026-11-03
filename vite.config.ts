import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    rolldownOptions: {
      input: { popup: "popup.html", options: "options.html" },
      output: { chunkFileNames: "assets/shared-[hash].js" },
    },
  },
});
