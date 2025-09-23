import { describe, it, expect } from "vitest";
import {
  validateForm,
  validateLocation,
  createLocation,
} from "@/core/useCases/routeForm";
import type {
  RouteFormValues,
  LocationFormValues,
} from "@/shared/lib/formAdapters";
import type { URLPath, Domain } from "@/core/entities/types";

describe("RouteFormUseCases.validateForm", () => {
  it("detects validation errors for domain/port/root", () => {
    const errors = validateForm({
      domain: "bad domain",
      port: 70000,
      root: "invalid path",
    } as RouteFormValues);
    expect(errors.domain).toMatch(/Invalid domain/);
    expect(errors.port).toMatch(/Port/);
    expect(errors.root).toMatch(/Invalid path/);
  });

  it("no errors for valid inputs", () => {
    const errors = validateForm({
      domain: "example.com",
      port: 80,
      root: "/var/www/html",
    } as RouteFormValues);
    expect(errors).toEqual({});
  });
});

describe("RouteFormUseCases.validateLocation", () => {
  it("validates location path format", () => {
    const err1 = validateLocation({ path: "bad" } as LocationFormValues);
    expect(err1.path).toMatch(/Invalid URL path/);
    const err2 = validateLocation({ path: "/ok" } as LocationFormValues);
    expect(err2.path).toBeUndefined();
  });
});

describe("RouteFormUseCases.createLocation", () => {
  it("creates location with defaults and overrides", () => {
    const loc = createLocation({});
    expect(loc.path).toBe("/");
    const loc2 = createLocation({
      path: "/api" as URLPath,
      proxy_pass: "http://backend" as Domain,
    });
    expect(loc2.path).toBe("/api");
    expect(loc2.proxy_pass).toBe("http://backend");
  });
});
