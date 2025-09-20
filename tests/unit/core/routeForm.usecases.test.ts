import { describe, it, expect } from "vitest";
import {
  validateForm,
  validateLocation,
  createLocation,
} from "@/core/useCases/routeForm";

describe("RouteFormUseCases.validateForm", () => {
  it("detects validation errors for domain/port/root", () => {
    const errors = validateForm({
      domain: "bad domain" as any,
      port: 70000 as any,
      root: "invalid path" as any,
    });
    expect(errors.domain).toMatch(/Invalid domain/);
    expect(errors.port).toMatch(/Port/);
    expect(errors.root).toMatch(/Invalid path/);
  });

  it("no errors for valid inputs", () => {
    const errors = validateForm({
      domain: "example.com" as any,
      port: 80 as any,
      root: "/var/www/html" as any,
    });
    expect(errors).toEqual({});
  });
});

describe("RouteFormUseCases.validateLocation", () => {
  it("validates location path format", () => {
    const err1 = validateLocation({ path: "bad" as any });
    expect(err1.path).toMatch(/Invalid URL path/);
    const err2 = validateLocation({ path: "/ok" as any });
    expect(err2.path).toBeUndefined();
  });
});

describe("RouteFormUseCases.createLocation", () => {
  it("creates location with defaults and overrides", () => {
    const loc = createLocation({});
    expect(loc.path).toBe("/");
    const loc2 = createLocation({
      path: "/api" as any,
      proxy_pass: "http://backend" as any,
    });
    expect(loc2.path).toBe("/api");
    expect(loc2.proxy_pass).toBe("http://backend");
  });
});
