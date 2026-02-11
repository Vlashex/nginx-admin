import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/main/main.ts"],
    format: ["cjs"],
    platform: "node",
    outDir: "dist/main",
    external: ["electron"],
  },
  {
    entry: ["src/preload/remoteBridge.ts"],
    format: ["cjs"],
    platform: "node",
    outDir: "dist/preload",
    external: ["electron"]
  },
]);
