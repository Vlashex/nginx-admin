import type { Resolver } from "react-hook-form";
import { validateForm } from "@/core/useCases/routeForm";

export type LocationFormValues = {
  path: string;
  proxy_pass?: string;
  try_files?: string;
  index?: string;
  extra_directives?: string;
};

export type RouteFormValues = {
  id?: string;
  domain: string;
  port: number;
  root: string;
  enabled: boolean;
  ssl: boolean;
  ssl_certificate?: string;
  ssl_certificate_key?: string;
  proxy_pass?: string;
  locations: LocationFormValues[];
  advanced: {
    client_max_body_size: string;
    keepalive_timeout: string;
    gzip: boolean;
    gzip_types: string;
    caching: boolean;
    cache_valid: string;
  };
};

export function createRouteDefaults(): RouteFormValues {
  return {
    domain: "",
    port: 80,
    root: "",
    enabled: true,
    ssl: false,
    ssl_certificate: "",
    ssl_certificate_key: "",
    proxy_pass: "",
    locations: [],
    advanced: {
      client_max_body_size: "1m",
      keepalive_timeout: "65s",
      gzip: false,
      gzip_types: "",
      caching: false,
      cache_valid: "",
    },
  };
}

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

export const routeFormResolver: Resolver<RouteFormValues> = async (values) => {
  const errors = validateForm(values as any);
  return mapErrorsToRHF(errors, values);
};

export function mapFormToRoute(values: RouteFormValues) {
  return {
    id: values.id || "preview",
    domain: values.domain as any,
    port: values.port as any,
    root: values.root as any,
    enabled: values.enabled,
    ssl: values.ssl,
    ssl_certificate: (values.ssl_certificate || undefined) as any,
    ssl_certificate_key: (values.ssl_certificate_key || undefined) as any,
    proxy_pass: (values.proxy_pass || undefined) as any,
    locations: values.locations as any,
    advanced: values.advanced as any,
  } as any;
}
