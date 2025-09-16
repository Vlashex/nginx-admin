// core/useCases/logs.ts
import type { LogEntry, LogFilters } from "@/shared/lib/core/entities/types";

export class LogUseCases {
  static filterLogs(logs: LogEntry[], filters: LogFilters): LogEntry[] {
    return logs.filter((log) => {
      if (
        filters.level &&
        filters.level !== "all" &&
        log.level !== filters.level
      ) {
        return false;
      }

      if (filters.source && log.source !== filters.source) {
        return false;
      }

      if (filters.routeId && log.routeId !== filters.routeId) {
        return false;
      }

      if (
        filters.search &&
        !log.message.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (filters.dateRange) {
        const logTime = log.timestamp.getTime();
        const startTime = filters.dateRange.start.getTime();
        const endTime = filters.dateRange.end.getTime();

        if (logTime < startTime || logTime > endTime) {
          return false;
        }
      }

      return true;
    });
  }

  static createLogEntry(logData: Omit<LogEntry, "id">): LogEntry {
    return {
      ...logData,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }
}
