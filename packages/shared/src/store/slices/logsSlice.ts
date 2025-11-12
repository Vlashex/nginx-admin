// store/slices/logsSlice.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { LogUseCases } from "@/core/useCases/logs";
import type { LogEntry, LogFilters } from "@/core/entities/types";

interface LogsState {
  logs: LogEntry[];
  filters: LogFilters;
  isLoading: boolean;
  isLive: boolean;
}

interface LogsActions {
  addLog: (log: Omit<LogEntry, "id">) => void;
  clearLogs: () => void;
  setFilter: (filter: Partial<LogFilters>) => void;
  loadLogs: () => Promise<void>;
  startLive: () => void;
  stopLive: () => void;
}

export const useLogsStore = create<LogsState & LogsActions>()(
  devtools(
    (set) => ({
      logs: [],
      filters: {
        level: "all",
        search: "",
        source: undefined,
        dateRange: undefined,
        routeId: undefined,
      },
      isLoading: false,
      isLive: false,

      addLog: (log) =>
        set((state) => ({
          logs: [...state.logs, LogUseCases.createLogEntry(log)],
        })),

      clearLogs: () => set({ logs: [] }),

      setFilter: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),

      loadLogs: async () => {
        set({ isLoading: true });
        try {
          const savedLogs = localStorage.getItem("nginx_logs");
          if (savedLogs) {
            const logs: LogEntry[] = JSON.parse(savedLogs);
            set({ logs, isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      startLive: () => {
        set({ isLive: true });
      },

      stopLive: () => {
        set({ isLive: false });
      },
    }),
    { name: "LogsStore" }
  )
);
