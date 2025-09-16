// core/repositories/LogRepository.ts
import type { LogEntry, LogFilters } from "@/shared/lib/core/entities/types";

export interface LogRepository {
  findAll(filters?: LogFilters): Promise<LogEntry[]>;
  save(log: Omit<LogEntry, "id">): Promise<string>;
  clear(): Promise<void>;
}
