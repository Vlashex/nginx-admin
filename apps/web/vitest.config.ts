import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@vlashex/shared/src": resolve(__dirname, "./src/shared"),
      "@/processes": resolve(__dirname, "./src/processes"),
    },
  },
  test: {
    include: ["tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{js,ts,jsx,tsx}"],
      exclude: ["**/node_modules/**"],
    },
  },
});
