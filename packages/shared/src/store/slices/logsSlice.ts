// store/slices/logsSlice.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { LogUseCases } from "@vlashex/core";
import { redactPotentialSecrets } from "@vlashex/core/security/secrets";
import type { LogEntry, LogFilters } from "@vlashex/core";

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

const SENSITIVE_KEY_PATTERN = /(token|secret|password|passphrase|private|auth|credential|key|jwt|session)/iu;

const sanitizeLogContext = (
  context: LogEntry["context"] | undefined
): LogEntry["context"] | undefined => {
  if (!context) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key)
        ? "[redacted]"
        : typeof value === "string"
          ? redactPotentialSecrets(value)
          : value,
    ])
  );
};

const sanitizeLog = (log: Omit<LogEntry, "id">): Omit<LogEntry, "id"> => ({
  ...log,
  message: redactPotentialSecrets(log.message),
  context: sanitizeLogContext(log.context),
});

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
          logs: [...state.logs, LogUseCases.createLogEntry(sanitizeLog(log))],
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
            const logs: LogEntry[] = JSON.parse(savedLogs).map((log: LogEntry) => ({
              ...log,
              message: redactPotentialSecrets(log.message),
              context: sanitizeLogContext(log.context),
            }));
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
