// shared/lib/factories.ts

import type {
  Domain,
  Port,
  UnixPath,
  URLPath,
  SizeUnit,
  TimeUnit,
  LocationConfig,
  AdvancedConfig,
  Route,
  LogEntry,
  LogLevel,
  LogSource,
  ServerState,
  ServerStatus,
} from "@/core/entities/types";
import { createBranded } from "./createBranded";

// ✅ брендированные
export const domain = (value: string): Domain =>
  createBranded<string, Domain>(value);

export const port = (value: number): Port => createBranded<number, Port>(value);

export const unixPath = (value: string): UnixPath =>
  createBranded<string, UnixPath>(value);

export const urlPath = (value: string): URLPath =>
  createBranded<string, URLPath>(value);

// ✅ простые строковые литералы
export const sizeUnit = (value: SizeUnit): SizeUnit => value;
export const timeUnit = (value: TimeUnit): TimeUnit => value;

// ---------- Location ----------
export function createLocationConfig(
  overrides: Partial<LocationConfig> = {}
): LocationConfig {
  return {
    path: urlPath("/"),
    proxy_pass: undefined,
    try_files: undefined,
    index: undefined,
    extra_directives: undefined,
    ...overrides,
  };
}

// ---------- Advanced ----------
export function createAdvancedConfig(
  overrides: Partial<AdvancedConfig> = {}
): AdvancedConfig {
  return {
    client_max_body_size: sizeUnit("1m"),
    keepalive_timeout: timeUnit("65s"),
    gzip: false,
    gzip_types: "",
    caching: false,
    cache_valid: timeUnit("1s"),
    ...overrides,
  };
}

// ---------- Route ----------
export function createRoute(overrides: Partial<Route> = {}): Route {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    domain: domain("sh.ru"),
    port: port(80),
    root: unixPath("/"),
    enabled: true,
    ssl: false,
    ssl_certificate: unixPath(""),
    ssl_certificate_key: unixPath(""),
    proxy_pass: undefined,
    locations: [],
    advanced: createAdvancedConfig(),
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      tags: [],
    },
    ...overrides,
  };
}

// ---------- Log ----------
export function createLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    level: "info" satisfies LogLevel,
    message: "",
    source: "system" satisfies LogSource,
    ...overrides,
  };
}

// ---------- Server ----------
export function createServerState(
  overrides: Partial<ServerState> = {}
): ServerState {
  return {
    status: "stopped" satisfies ServerStatus,
    stats: {
      requests: 0,
      traffic: "0b",
      activeConnections: 0,
      uptime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
    },
    version: "0.0.0",
    lastUpdated: new Date(),
    ...overrides,
  };
}
