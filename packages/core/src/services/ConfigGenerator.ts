// core/services/ConfigGenerator.ts
import type { Route, LocationConfig } from "../entities/types";

const indent = (lines: string[], level = 1) =>
  lines
    .filter(Boolean)
    .map((line) => "    ".repeat(level) + line)
    .join("\n");

/**
 * Генерирует человеко-читаемый Nginx-конфиг для предпросмотра.
 */
export const generateConfigPreview = (route: Route): string => {
  const lines: string[] = [];

  // --- Server header ---
  lines.push("server {");

  const baseDirectives = [
    `listen ${route.port}${route.ssl ? " ssl" : ""};`,
    `server_name ${route.domain};`,
    `root ${route.root};`,
  ];

  lines.push(indent(baseDirectives));

  // --- SSL block ---
  if (route.ssl && route.ssl_certificate && route.ssl_certificate_key) {
    lines.push(""); // 👈 разделитель
    lines.push(
      indent([
        `ssl_certificate ${route.ssl_certificate};`,
        `ssl_certificate_key ${route.ssl_certificate_key};`,
      ])
    );
  }

  // --- Advanced block ---
  const adv = route.advanced;
  if (adv) {
    const advLines: string[] = [];

    advLines.push(
      `client_max_body_size ${adv.client_max_body_size};`,
      `keepalive_timeout ${adv.keepalive_timeout};`
    );

    if (adv.gzip) {
      advLines.push("gzip on;", `gzip_types ${adv.gzip_types};`);
    }

    if (adv.caching) {
      advLines.push(`proxy_cache_valid ${adv.cache_valid};`);
    }

    if (advLines.length > 0) {
      lines.push(""); // 👈 разделитель
      lines.push(indent(advLines));
    }
  }

  // --- Locations block ---
  if (route.locations && route.locations.length > 0) {
    lines.push(""); // 👈 разделитель
    for (const loc of route.locations) {
      lines.push(renderLocationBlock(loc));
      lines.push(""); // 👈 пустая строка между location-блоками
    }
  }

  lines.push("}");

  // Убираем лишние пустые строки перед закрывающей скобкой
  return (
    lines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n") // не больше двух подряд
      .trimEnd() + "\n"
  );
};

function renderLocationBlock(loc: LocationConfig): string {
  const locLines: string[] = [];

  if (loc.proxy_pass) locLines.push(`proxy_pass ${loc.proxy_pass};`);
  if (loc.try_files) locLines.push(`try_files ${loc.try_files};`);
  if (loc.index) locLines.push(`index ${loc.index};`);
  if (loc.extra_directives) locLines.push(loc.extra_directives.trim());

  return [`    location ${loc.path} {`, indent(locLines, 2), "    }"].join(
    "\n"
  );
}
