// core/services/IntegrationService.ts
import type {
  ServerState,
  LogLevel,
  LogSource,
  Route,
} from "../entities/types";

export interface LogEntryData {
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: LogSource;
}

export class IntegrationService {
  static handleServerStatusChange(
    currentStatus: ServerState["status"],
    previousStatus: ServerState["status"]
  ): LogEntryData | null {
    if (currentStatus !== previousStatus) {
      return {
        timestamp: new Date(),
        level: "info" as const,
        message: `Server ${currentStatus}`,
        source: "system" as const,
      };
    }
    return null;
  }

  static handleRouteSelectionChange(
    currentRouteId: string | null,
    previousRouteId: string | null,
    routes: Map<string, Route>
  ): Route | null {
    if (currentRouteId !== previousRouteId) {
      if (currentRouteId) {
        const route = routes.get(currentRouteId);
        if (route) {
          return route;
        }
      }
    }
    return null;
  }
}
