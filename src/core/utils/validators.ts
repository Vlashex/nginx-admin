import {
  DomainSchema,
  PortSchema,
  UnixPathSchema,
  URLPathSchema,
  LocationConfigSchema,
  SizeUnitSchema,
  TimeUnitSchema,
  AdvancedConfigSchema,
  LogLevelSchema,
  LogSourceSchema,
  LogEntrySchema,
  LogFiltersSchema,
  ServerStatusSchema,
  ServerStateSchema,
  RouteSchema,
} from "@/core/entities/types";

import type {
  Domain,
  Port,
  UnixPath,
  URLPath,
  LocationConfig,
  SizeUnit,
  TimeUnit,
  AdvancedConfig,
  LogLevel,
  LogSource,
  LogEntry,
  LogFilters,
  ServerStatus,
  ServerState,
  Route,
} from "@/core/entities/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const makeValidator =
  <T>(schema: { safeParse: (value: unknown) => any }) =>
  (value: unknown): value is T =>
    schema.safeParse(value).success;
/* eslint-enable @typescript-eslint/no-explicit-any */

export const validateDomain = makeValidator<Domain>(DomainSchema);
export const validatePort = makeValidator<Port>(PortSchema);
export const validateUnixPath = makeValidator<UnixPath>(UnixPathSchema);
export const validateURLPath = makeValidator<URLPath>(URLPathSchema);
export const validateLocation =
  makeValidator<LocationConfig>(LocationConfigSchema);
export const validateSizeUnit = makeValidator<SizeUnit>(SizeUnitSchema);
export const validateTimeUnit = makeValidator<TimeUnit>(TimeUnitSchema);
export const validateAdvancedConfig =
  makeValidator<AdvancedConfig>(AdvancedConfigSchema);
export const validateLogLevel = makeValidator<LogLevel>(LogLevelSchema);
export const validateLogSource = makeValidator<LogSource>(LogSourceSchema);
export const validateLogEntry = makeValidator<LogEntry>(LogEntrySchema);
export const validateLogFilters = makeValidator<LogFilters>(LogFiltersSchema);
export const validateServerStatus =
  makeValidator<ServerStatus>(ServerStatusSchema);
export const validateServerState =
  makeValidator<ServerState>(ServerStateSchema);
export const validateRoute = makeValidator<Route>(RouteSchema);
