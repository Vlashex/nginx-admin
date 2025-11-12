import { describe, it, expect } from "vitest";
import { LogUseCases } from "@vlashex/core/useCases/logs";
import type { LogEntry } from "@vlashex/core/entities/types";

const sampleLogs = (): LogEntry[] => {
  const baseTime = new Date("2024-01-01T00:00:00Z").getTime();
  return [
    {
      id: "1",
      level: "info",
      message: "Server started",
      source: "system",
      timestamp: new Date(baseTime),
      routeId: undefined,
    },
    {
      id: "2",
      level: "error",
      message: "Route failed to load",
      source: "nginx",
      timestamp: new Date(baseTime + 1000),
      routeId: "r1",
    },
    {
      id: "3",
      level: "warn",
      message: "High memory usage",
      source: "system",
      timestamp: new Date(baseTime + 2000),
      routeId: "r2",
    },
  ];
};

describe("LogUseCases.filterLogs", () => {
  it("returns all when filters neutral", () => {
    const logs = sampleLogs();
    const result = LogUseCases.filterLogs(logs, {
      level: "all",
      search: "",
      source: undefined,
      dateRange: undefined,
      routeId: undefined,
    });
    expect(result).toHaveLength(logs.length);
  });

  it("filters by level, source, routeId, search, dateRange", () => {
    const logs = sampleLogs();
    expect(
      LogUseCases.filterLogs(logs, {
        level: "error",
        search: "",
        source: undefined,
        dateRange: undefined,
        routeId: undefined,
      })
    ).toEqual([logs[1]]);

    expect(
      LogUseCases.filterLogs(logs, {
        level: "all",
        search: "",
        source: "system",
        dateRange: undefined,
        routeId: undefined,
      })
    ).toEqual([logs[0], logs[2]]);

    expect(
      LogUseCases.filterLogs(logs, {
        level: "all",
        search: "route",
        source: undefined,
        dateRange: undefined,
        routeId: undefined,
      })
    ).toEqual([logs[1]]);

    expect(
      LogUseCases.filterLogs(logs, {
        level: "all",
        search: "",
        source: undefined,
        dateRange: {
          start: new Date("2024-01-01T00:00:00Z"),
          end: new Date("2024-01-01T00:00:01Z"),
        },
        routeId: undefined,
      })
    ).toEqual([logs[0], logs[1]]);

    expect(
      LogUseCases.filterLogs(logs, {
        level: "all",
        search: "",
        source: undefined,
        dateRange: undefined,
        routeId: "r2",
      })
    ).toEqual([logs[2]]);
  });
});

describe("LogUseCases.createLogEntry", () => {
  it("generates id and preserves payload", () => {
    const entry = LogUseCases.createLogEntry({
      level: "info",
      message: "Test",
      source: "system",
      timestamp: new Date(),
      routeId: undefined,
    });
    expect(entry.id).toMatch(/^log_\d+_[a-z0-9]{9}$/);
    expect(entry.message).toBe("Test");
  });
});
