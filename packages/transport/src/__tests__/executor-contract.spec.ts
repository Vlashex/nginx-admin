import { describe, expect, it, vi } from "vitest";
import type { RouteCommandMap } from "../contracts/routeCommands";
import type { RemoteExecutor } from "../RemoteExecutor";

describe("RemoteExecutor contract", () => {
  it("is command/payload typed", async () => {
    const exec: RemoteExecutor<RouteCommandMap> = {
      execute: vi.fn(async (command) => {
        if (command === "routes:list") {
          return { routes: [] };
        }
        throw new Error("not implemented");
      }),
    };

    const result = await exec.execute("routes:list", { includeDisabled: true });
    expect(result.routes).toEqual([]);
  });
});
