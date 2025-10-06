import { z } from "zod";

export type DomainForm = string;
export type PortForm = number;
export type UnixPathForm = string;
export type URLPathForm = string;

/* ──────────── Branded primitives ──────────── */

export const DomainSchema = z
  .string()
  .regex(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    "Invalid domain"
  )
  .brand<"Domain">();
export type Domain = z.infer<typeof DomainSchema>;

export const PortSchema = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() !== "") {
    const num = Number(val);
    return Number.isNaN(num) ? val : num;
  }
  return val;
}, z.number().int().min(1).max(65535).brand<"Port">());
export type Port = z.infer<typeof PortSchema>;

export const UnixPathSchema = z
  .string()
  .regex(/^\/([a-zA-Z0-9_.-]+(\/[a-zA-Z0-9_.-]+)*)?$/, "Invalid unix path")
  .or(z.literal(""))
  .brand<"UnixPath">();
export type UnixPath = z.infer<typeof UnixPathSchema>;

export const URLPathSchema = z
  .string()
  .regex(/^\/[a-zA-Z0-9_./-]*$/, "Invalid url path")
  .brand<"URLPath">();
export type URLPath = z.infer<typeof URLPathSchema>;

/* ──────────── Units ──────────── */

export const SizeUnitSchema = z.string().regex(/^\d+[kmg]$/i);
export type SizeUnit = z.infer<typeof SizeUnitSchema>;

export const TimeUnitSchema = z.string().regex(/^\d+[smhd]$/i);
export type TimeUnit = z.infer<typeof TimeUnitSchema>;

/* ──────────── Configs ──────────── */

export const LocationConfigSchema = z.object({
  path: URLPathSchema,
  proxy_pass: DomainSchema.optional(),
  try_files: z.string().optional(),
  index: z.string().optional(),
  extra_directives: z.string().optional(),
});
export type LocationConfig = z.infer<typeof LocationConfigSchema>;

export const AdvancedConfigValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  SizeUnitSchema,
  TimeUnitSchema,
]);
export type AdvancedConfigValue = z.infer<typeof AdvancedConfigValueSchema>;

export const AdvancedConfigSchema = z
  .object({
    client_max_body_size: SizeUnitSchema,
    keepalive_timeout: TimeUnitSchema,
    gzip: z.boolean(),
    gzip_types: z.string(),
    caching: z.boolean(),
    cache_valid: TimeUnitSchema,
  })
  .catchall(AdvancedConfigValueSchema);
export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>;

/* ──────────── Route ──────────── */

export const RouteSchema = z.object({
  id: z.string(),
  domain: DomainSchema,
  port: PortSchema,
  root: UnixPathSchema,
  enabled: z.boolean(),
  ssl: z.boolean(),
  ssl_certificate: UnixPathSchema.optional(),
  ssl_certificate_key: UnixPathSchema.optional(),
  proxy_pass: DomainSchema.optional(),
  locations: z.array(LocationConfigSchema),
  advanced: AdvancedConfigSchema.optional(),
  metadata: z
    .object({
      createdAt: z.date(),
      updatedAt: z.date(),
      createdBy: z.string(),
      tags: z.array(z.string()),
    })
    .optional(),
});
export type Route = z.infer<typeof RouteSchema>;
export type RouteInput = z.input<typeof RouteSchema>;
export type RouteOutput = z.output<typeof RouteSchema>;

/* ──────────── Logs ──────────── */

export const LogLevelSchema = z.enum(["info", "warning", "error", "debug"]);
export type LogLevel = z.infer<typeof LogLevelSchema>;

export const LogSourceSchema = z.enum(["nginx", "system", "user"]);
export type LogSource = z.infer<typeof LogSourceSchema>;

export const LogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  level: LogLevelSchema,
  message: z.string(),
  source: LogSourceSchema,
  ip: z.string().optional(),
  routeId: z.string().optional(),
  context: z
    .record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.null()])
    )
    .optional(),
});
export type LogEntry = z.infer<typeof LogEntrySchema>;

export const LogFiltersSchema = z.object({
  level: LogLevelSchema.or(z.literal("all")).optional(),
  search: z.string(),
  source: LogSourceSchema.optional(),
  routeId: z.string().optional(),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
});
export type LogFilters = z.infer<typeof LogFiltersSchema>;

/* ──────────── Server ──────────── */

export const ServerStatusSchema = z.enum(["running", "stopped", "restarting"]);
export type ServerStatus = z.infer<typeof ServerStatusSchema>;

export const ServerStateSchema = z.object({
  status: ServerStatusSchema,
  stats: z.object({
    requests: z.number(),
    traffic: z.string(),
    activeConnections: z.number(),
    uptime: z.number(),
    cpuUsage: z.number(),
    memoryUsage: z.number(),
  }),
  version: z.string(),
  lastUpdated: z.date(),
});
export type ServerState = z.infer<typeof ServerStateSchema>;
