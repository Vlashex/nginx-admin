// core/entities/types.ts

declare const DomainBrand: unique symbol;
declare const PortBrand: unique symbol;
declare const UnixPathBrand: unique symbol;
declare const URLPathBrand: unique symbol;

export type Domain = string & { readonly _brand: typeof DomainBrand };
export type Port = number & { readonly _brand: typeof PortBrand };
export type UnixPath = string & { readonly _brand: typeof UnixPathBrand };
export type URLPath = string & { readonly _brand: typeof URLPathBrand };

export type SizeUnit = `${number}${"k" | "m" | "g"}`;
export type TimeUnit = `${number}${"s" | "m" | "h" | "d"}`;

export interface LocationConfig {
  path: URLPath;
  proxy_pass?: Domain;
  try_files?: string;
  index?: string;
  extra_directives?: string;
}

export type AdvancedConfigValue =
  | string
  | number
  | boolean
  | SizeUnit
  | TimeUnit;
export interface AdvancedConfig {
  client_max_body_size: SizeUnit;
  keepalive_timeout: TimeUnit;
  gzip: boolean;
  gzip_types: string;
  caching: boolean;
  cache_valid: TimeUnit;
  [key: string]: AdvancedConfigValue;
}

export interface Route {
  id: string;
  domain: Domain;
  port: Port;
  root: UnixPath;
  enabled: boolean;
  ssl: boolean;
  ssl_certificate?: UnixPath;
  ssl_certificate_key?: UnixPath;
  proxy_pass?: Domain;
  locations: LocationConfig[];
  advanced?: AdvancedConfig;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
  };
}

export type LogLevel = "info" | "warning" | "error" | "debug";
export type LogSource = "nginx" | "system" | "user";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: LogSource;
  ip?: string;
  routeId?: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface LogFilters {
  level?: LogLevel | "all";
  search: string;
  source?: LogSource;
  dateRange?: {
    start: Date;
    end: Date;
  };
  routeId?: string;
}

export type ServerStatus = "running" | "stopped" | "restarting";

export interface ServerState {
  status: ServerStatus;
  stats: {
    requests: number;
    traffic: string;
    activeConnections: number;
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  version: string;
  lastUpdated: Date;
}
