import { defineConfig, devices } from "@playwright/test";
import { resolve } from "path";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      process.platform === "win32" ? "npm run dev -- --host" : "npm run dev",
    port: 5173,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    // Add this to handle path aliases
    env: {
      NODE_ENV: "development",
    },
  },
  // Add global setup if needed
  // globalSetup: require.resolve('./global-setup'),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
