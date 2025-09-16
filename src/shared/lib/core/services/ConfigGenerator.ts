// core/services/ConfigGenerator.ts
import type { Route } from "@/shared/lib/core/entities/types";

export const generateConfigPreview = (route: Route): string => {
  const { domain, port, root, ssl, locations, advanced } = route;

  return (
    `server {
    listen ${port}${ssl ? " ssl" : ""};
    server_name ${domain};
    root ${root};
    
    ${
      ssl && route.ssl_certificate && route.ssl_certificate_key
        ? `
    ssl_certificate ${route.ssl_certificate};
    ssl_certificate_key ${route.ssl_certificate_key};`
        : ""
    }
    ` +
    (typeof advanced !== "undefined"
      ? `
    client_max_body_size ${advanced.client_max_body_size};
    keepalive_timeout ${advanced.keepalive_timeout};
    
    ${
      advanced.gzip
        ? `
    gzip on;
    gzip_types ${advanced.gzip_types};`
        : ""
    }`
      : "") +
    `
    
    ${locations
      .map(
        (loc) => `
    location ${loc.path} {
        ${loc.proxy_pass ? `proxy_pass ${loc.proxy_pass};` : ""}
        ${loc.try_files ? `try_files ${loc.try_files};` : ""}
        ${loc.index ? `index ${loc.index};` : ""}
        ${loc.extra_directives || ""}
    }`
      )
      .join("\n")}
}`
  );
};
