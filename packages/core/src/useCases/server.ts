// core/useCases/server.ts
import type { ServerState } from "../entities/types";

export class ServerUseCases {
  static toggleStatus(
    currentStatus: ServerState["status"],
    newStatus?: ServerState["status"]
  ): ServerState["status"] {
    return newStatus || (currentStatus === "running" ? "stopped" : "running");
  }

  static updateStats(
    currentStats: ServerState["stats"],
    newStats: Partial<ServerState["stats"]>
  ): ServerState["stats"] {
    return { ...currentStats, ...newStats };
  }
}
