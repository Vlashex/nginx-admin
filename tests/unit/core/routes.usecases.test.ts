import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createRoute,
  updateRoute,
  toggleRouteStatus,
} from "@/shared/lib/core/useCases/routes";
import type { Route } from "@/shared/lib/core/entities/types";
import type { RouteRepository } from "@/shared/lib/core/repositories/RouteRepository";

const makeRepo = () => {
  const memory = new Map<string, Route>();
  const repo: RouteRepository = {
    async save(route: Route) {
      memory.set(route.id, route);
    },
    async findById(id: string) {
      return memory.get(id);
    },
    async delete(id: string) {
      memory.delete(id);
    },
    async loadAll() {
      return new Map(memory);
    },
    async saveAll(routes: Map<string, Route>) {
      for (const [id, r] of routes) memory.set(id, r);
    },
  };
  return { repo, memory };
};

describe("RouteUseCases.createRoute", () => {
  it("validates and generates id, saves to repo", async () => {
    const { repo, memory } = makeRepo();
    const id = await createRoute(repo, {
      domain: "example.com" as any,
      port: 80 as any,
      root: "/var/www/html" as any,
      enabled: true,
      ssl: false,
      locations: [],
      advanced: {
        client_max_body_size: "1m" as any,
        keepalive_timeout: "65s" as any,
        gzip: true,
        gzip_types: "text/plain",
        caching: false,
        cache_valid: "5m" as any,
      },
    });

    expect(id).toMatch(/^route_\d+_[a-z0-9]{9}$/);
    const saved = memory.get(id)!;
    expect(saved.id).toBe(id);
    expect(saved.metadata?.createdAt).toBeInstanceOf(Date);
    expect(saved.metadata?.updatedAt).toBeInstanceOf(Date);
  });

  it("throws on invalid domain/port/path", async () => {
    const { repo } = makeRepo();
    await expect(
      createRoute(repo, {
        domain: "bad domain" as any,
        port: 80 as any,
        root: "/var/www/html" as any,
        enabled: true,
        ssl: false,
        locations: [],
        advanced: {
          client_max_body_size: "1m" as any,
          keepalive_timeout: "65s" as any,
          gzip: false,
          gzip_types: "",
          caching: false,
          cache_valid: "5m" as any,
        },
      })
    ).rejects.toThrow(/Invalid domain/);

    await expect(
      createRoute(repo, {
        domain: "example.com" as any,
        port: 70000 as any,
        root: "/var/www/html" as any,
        enabled: true,
        ssl: false,
        locations: [],
        advanced: {
          client_max_body_size: "1m" as any,
          keepalive_timeout: "65s" as any,
          gzip: false,
          gzip_types: "",
          caching: false,
          cache_valid: "5m" as any,
        },
      })
    ).rejects.toThrow(/Port/);

    await expect(
      createRoute(repo, {
        domain: "example.com" as any,
        port: 80 as any,
        root: "invalid path" as any,
        enabled: true,
        ssl: false,
        locations: [],
        advanced: {
          client_max_body_size: "1m" as any,
          keepalive_timeout: "65s" as any,
          gzip: false,
          gzip_types: "",
          caching: false,
          cache_valid: "5m" as any,
        },
      })
    ).rejects.toThrow(/Invalid path/);
  });
});

describe("RouteUseCases.updateRoute", () => {
  it("updates metadata.updatedAt and merges fields", async () => {
    const { repo, memory } = makeRepo();
    const id = await createRoute(repo, {
      domain: "example.com" as any,
      port: 80 as any,
      root: "/var/www/html" as any,
      enabled: true,
      ssl: false,
      locations: [],
      advanced: {
        client_max_body_size: "1m" as any,
        keepalive_timeout: "65s" as any,
        gzip: true,
        gzip_types: "text/plain",
        caching: false,
        cache_valid: "5m" as any,
      },
    });

    const before = memory.get(id)!;
    await new Promise((r) => setTimeout(r, 5));
    await updateRoute(repo, id, { domain: "new.example.com" as any });
    const after = memory.get(id)!;
    expect(after.domain).toBe("new.example.com");
    expect(after.metadata?.updatedAt.getTime()).toBeGreaterThan(
      before.metadata!.updatedAt.getTime()
    );
  });

  it("throws if route not found", async () => {
    const { repo } = makeRepo();
    await expect(
      updateRoute(repo, "missing", { enabled: false })
    ).rejects.toThrow(/Route not found/);
  });
});

describe("RouteUseCases.toggleRouteStatus", () => {
  it("inverts enabled flag", async () => {
    const { repo, memory } = makeRepo();
    const id = await createRoute(repo, {
      domain: "example.com" as any,
      port: 80 as any,
      root: "/var/www/html" as any,
      enabled: true,
      ssl: false,
      locations: [],
      advanced: {
        client_max_body_size: "1m" as any,
        keepalive_timeout: "65s" as any,
        gzip: false,
        gzip_types: "",
        caching: false,
        cache_valid: "5m" as any,
      },
    });
    await toggleRouteStatus(repo, id);
    expect(memory.get(id)!.enabled).toBe(false);
    await toggleRouteStatus(repo, id);
    expect(memory.get(id)!.enabled).toBe(true);
  });

  it("throws if route not found", async () => {
    const { repo } = makeRepo();
    await expect(toggleRouteStatus(repo, "x")).rejects.toThrow(
      /Route not found/
    );
  });
});
