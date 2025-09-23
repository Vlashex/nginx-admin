import type { Resolver } from "react-hook-form";
import { validateForm } from "@/core/useCases/routeForm";
import type {
  Route,
  Domain,
  Port,
  UnixPath,
  AdvancedConfig,
} from "@/core/entities/types";
import { domain, urlPath } from "./factories";

function mapErrorsToRHF<TValues>(
  errors: Record<string, string>,
  values: TValues
): {
  values: TValues;
  errors: Record<string, { type: string; message: string }>;
} {
  const rhfErrors: Record<string, { type: string; message: string }> = {};
  Object.entries(errors).forEach(([k, v]) => {
    rhfErrors[k] = { type: "manual", message: v };
  });
  return { values, errors: rhfErrors };
}

export const routeFormResolver: Resolver<Route> = async (values) => {
  const errors = validateForm(values as Partial<Route>);
  return mapErrorsToRHF(errors, values);
};

export function mapFormToRoute(values: Route): Route {
  return {
    id: values.id || "preview",
    domain: values.domain as Domain,
    port: values.port as Port,
    root: values.root as UnixPath,
    enabled: values.enabled,
    ssl: values.ssl,
    ssl_certificate: values.ssl_certificate
      ? (values.ssl_certificate as UnixPath)
      : undefined,
    ssl_certificate_key: values.ssl_certificate_key
      ? (values.ssl_certificate_key as UnixPath)
      : undefined,
    proxy_pass: values.proxy_pass ? domain(values.proxy_pass) : undefined,
    locations: values.locations.map((loc) => ({
      path: urlPath(loc.path),
      proxy_pass: loc.proxy_pass ? domain(loc.proxy_pass) : undefined,
      try_files: loc.try_files,
      index: loc.index,
      extra_directives: loc.extra_directives,
    })),
    advanced: {
      client_max_body_size: values.advanced
        ?.client_max_body_size as `${number}${"k" | "m" | "g"}`,
      keepalive_timeout: values.advanced?.keepalive_timeout as `${number}${
        | "s"
        | "m"
        | "h"
        | "d"}`,
      gzip: values.advanced?.gzip,
      gzip_types: values.advanced?.gzip_types,
      caching: values.advanced?.caching,
      cache_valid: values.advanced?.cache_valid as `${number}${
        | "s"
        | "m"
        | "h"
        | "d"}`,
    } as AdvancedConfig,
  };
}
