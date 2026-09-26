import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Builds the claude.ai demo: relative asset paths and stable file names so the artifact page can
// reference assets/demo.js and assets/demo.css directly.
export default defineConfig({
  plugins: [react()],
  base: "./",
  define: {
    "import.meta.env.VITE_DEMO": JSON.stringify("1"),
  },
  build: {
    outDir: "dist-demo",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: "demo.html",
      output: {
        entryFileNames: "assets/demo.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (asset) => (asset.names?.some((n) => n.endsWith(".css")) ? "assets/demo.css" : "assets/[name][extname]"),
      },
    },
  },
});
