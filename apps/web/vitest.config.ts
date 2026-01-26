import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@vlashex/core": path.resolve(__dirname, "../../packages/core"),
      "@vlashex/shared": path.resolve(
        __dirname,
        "../../packages/shared"
      ),
      "@vlashex/shared-store": path.resolve(
        __dirname,
        "../../packages/shared-store"
      ),
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
