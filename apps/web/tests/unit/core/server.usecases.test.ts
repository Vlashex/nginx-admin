import { describe, it, expect } from "vitest";
import { ServerUseCases } from "@vlashex/core/useCases/server";

describe("ServerUseCases.toggleStatus", () => {
  it("toggles from stopped to running when newStatus not provided", () => {
    expect(ServerUseCases.toggleStatus("stopped")).toBe("running");
  });

  it("toggles from running to stopped when newStatus not provided", () => {
    expect(ServerUseCases.toggleStatus("running")).toBe("stopped");
  });

  it("returns explicit newStatus when provided (idempotent)", () => {
    expect(ServerUseCases.toggleStatus("running", "running")).toBe("running");
    expect(ServerUseCases.toggleStatus("stopped", "running")).toBe("running");
  });
});

describe("ServerUseCases.updateStats", () => {
  it("merges partial stats without mutating base", () => {
    const base = {
      requests: 1,
      traffic: "10KB",
      activeConnections: 2,
      uptime: 3,
      cpuUsage: 1,
      memoryUsage: 2,
    } as const;
    const merged = ServerUseCases.updateStats(base, {
      requests: 5,
      cpuUsage: 50,
    });
    expect(merged).toEqual({
      ...base,
      requests: 5,
      cpuUsage: 50,
    });
    expect(merged).not.toBe(base);
  });

  it("handles empty updates and returns equal values", () => {
    const base = {
      requests: 0,
      traffic: "0B",
      activeConnections: 0,
      uptime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
    } as const;
    const merged = ServerUseCases.updateStats(base, {});
    expect(merged).toEqual(base);
  });
});
