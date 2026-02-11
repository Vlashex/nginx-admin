import { describe, expect, it, vi } from "vitest";
import { SSHRouteRepository } from "../SSHRouteRepository";
import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";

describe("SSHRouteRepository", () => {
  it("maps list/save/toggle via RemoteExecutor", async () => {
    const executor: RemoteExecutor<RouteCommandMap> = {
      execute: vi.fn(async (command) => {
        if (command === "routes:list") {
          return { routes: [] };
        }
        if (command === "routes:save") {
          return {
            route: { id: "r1", host: "a", destination: "b", enabled: true, updatedAt: "2026-01-01" },
          };
        }
        return {
          route: { id: "r1", host: "a", destination: "b", enabled: false, updatedAt: "2026-01-01" },
        };
      }),
    };

    const repo = new SSHRouteRepository(executor);
    await expect(repo.list()).resolves.toEqual([]);
    await expect(repo.save({ host: "a", destination: "b" })).resolves.toMatchObject({ id: "r1" });
    await expect(repo.toggle({ id: "r1", enabled: false })).resolves.toMatchObject({ enabled: false });
  });
});
