// store/slices/serverSlice.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { ServerUseCases } from "@/shared/lib/core/useCases/server";
import type {
  ServerState,
  ServerStatus,
} from "@/shared/lib/core/entities/types";

interface ServerActions {
  toggleStatus: (status?: ServerStatus) => void;
  updateStats: (stats: Partial<ServerState["stats"]>) => void;
  updateServerInfo: (info: { version: string }) => void;
}

export const useServerStore = create<ServerState & ServerActions>()(
  devtools(
    (set) => ({
      status: "stopped",
      stats: {
        requests: 0,
        traffic: "0B",
        activeConnections: 0,
        uptime: 0,
        cpuUsage: 0,
        memoryUsage: 0,
      },
      version: "",
      lastUpdated: new Date(),

      toggleStatus: (status) =>
        set((state) => ({
          status: ServerUseCases.toggleStatus(state.status, status),
        })),

      updateStats: (newStats) =>
        set((state) => ({
          stats: ServerUseCases.updateStats(state.stats, newStats),
          lastUpdated: new Date(),
        })),

      updateServerInfo: (info) =>
        set({
          version: info.version,
          lastUpdated: new Date(),
        }),
    }),
    { name: "ServerStore" }
  )
);
