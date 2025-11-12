import { z } from "zod";

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

export const ProxyTargetSchema = z
  .string()
  .regex(
    /^(https?:\/\/)?([a-zA-Z0-9.-]+)(:\d+)?(\/.*)?$/,
    "Invalid proxy target (must be domain or URL)"
  )
  .optional();

/**
 * Location block — взаимоcвязи:
 * - proxy_pass и try_files не должны использоваться вместе.
 * - path всегда начинается с /.
 */
export const LocationConfigSchema = z
  .object({
    path: URLPathSchema,
    proxy_pass: ProxyTargetSchema,
    try_files: z.string().optional(),
    index: z.string().optional(),
    extra_directives: z.string().optional(),
  })
  .superRefine((loc, ctx) => {
    if (loc.proxy_pass && loc.try_files) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "proxy_pass и try_files не должны использоваться вместе",
        path: ["try_files"],
      });
    }
  });
export type LocationConfig = z.infer<typeof LocationConfigSchema>;

/**
 * Advanced config — зависимости:
 * - gzip_types обязательно, если gzip === true
 * - cache_valid обязательно, если caching === true
 */
export const AdvancedConfigSchema = z
  .object({
    client_max_body_size: SizeUnitSchema,
    keepalive_timeout: TimeUnitSchema,
    gzip: z.boolean(),
    gzip_types: z.string().optional(),
    caching: z.boolean(),
    cache_valid: TimeUnitSchema.optional(),
  })
  .superRefine((adv, ctx) => {
    if (adv.gzip && (!adv.gzip_types || adv.gzip_types.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Необходимо указать gzip_types при включённом gzip",
        path: ["gzip_types"],
      });
    }

    if (!adv.gzip && adv.gzip_types) {
      adv.gzip_types = undefined;
    }

    if (adv.caching && !adv.cache_valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Необходимо указать cache_valid при включённом caching",
        path: ["cache_valid"],
      });
    }

    if (!adv.caching && adv.cache_valid) {
      adv.cache_valid = undefined;
    }
  });
export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>;

/* ──────────── Route ──────────── */

export const RouteSchema = z
  .object({
    id: z.string(),
    domain: DomainSchema,
    port: PortSchema,
    root: UnixPathSchema,
    enabled: z.boolean(),
    ssl: z.boolean(),
    ssl_certificate: UnixPathSchema.optional(),
    ssl_certificate_key: UnixPathSchema.optional(),
    proxy_pass: ProxyTargetSchema,
    locations: z.array(LocationConfigSchema),
    advanced: AdvancedConfigSchema.optional(),
    metadata: z
      .object({
        createdAt: z.preprocess(
          (val) => (typeof val === "string" ? new Date(val) : val),
          z.date()
        ),
        updatedAt: z.preprocess(
          (val) => (typeof val === "string" ? new Date(val) : val),
          z.date()
        ),
        createdBy: z.string(),
        tags: z.array(z.string()),
      })
      .optional(),
  })
  .superRefine((route, ctx) => {
    // SSL зависимости
    if (route.ssl) {
      if (!route.ssl_certificate || !route.ssl_certificate_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "SSL включён, но отсутствуют ssl_certificate и/или ssl_certificate_key",
          path: ["ssl_certificate"],
        });
      }
    } else {
      // если SSL выключен — очищаем поля
      route.ssl_certificate = undefined;
      route.ssl_certificate_key = undefined;
    }

    // Proxy_pass и locations не должны использоваться вместе
    if (route.proxy_pass && route.locations.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "proxy_pass на уровне server и location-блоки не должны использоваться одновременно",
        path: ["proxy_pass"],
      });
    }

    // root обязателен, если proxy_pass отсутствует
    if (!route.proxy_pass && route.root.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Поле root обязательно, если не указан proxy_pass",
        path: ["root"],
      });
    }

    // порт 443 требует SSL
    if (route.port === 443 && !route.ssl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Порт 443 требует включённый SSL",
        path: ["ssl"],
      });
    }

    // порт 80 не должен использовать SSL
    if (route.port === 80 && route.ssl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Порт 80 не может использовать SSL",
        path: ["ssl"],
      });
    }

    // проверка дублирующихся путей
    const paths = route.locations.map((l) => l.path);
    const duplicates = paths.filter((p, i) => paths.indexOf(p) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Найдено несколько location с одинаковым путём: ${duplicates.join(
          ", "
        )}`,
        path: ["locations"],
      });
    }
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
