/**
 * Vitest Configuration
 * Test framework configuration for unit and integration tests
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    server: {
      deps: {
        inline: [
          // Fix ESM compatibility issues with jsdom dependencies
          "@exodus/bytes",
          "html-encoding-sniffer",
        ],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
