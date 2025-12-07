import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  build: { assetsInlineLimit: 0 },
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});
