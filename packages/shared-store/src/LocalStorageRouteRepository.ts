import type { Route } from "@vlashex/core";
import type { RouteRepository } from "@vlashex/core";

type PersistedRoute = Omit<Route, "metadata"> & {
  metadata?: Route["metadata"] extends infer M
    ? M extends object
      ? Omit<M, "createdAt" | "updatedAt"> & {
          createdAt?: string;
          updatedAt?: string;
        }
      : never
    : never;
};

const KEY = "nginx_routes";

function revive(route: PersistedRoute): Route {
  return {
    ...route,
    metadata: route.metadata
      ? {
          ...route.metadata,
          createdAt: route.metadata.createdAt
            ? new Date(route.metadata.createdAt)
            : new Date(),
          updatedAt: route.metadata.updatedAt
            ? new Date(route.metadata.updatedAt)
            : new Date(),
        }
      : undefined,
  };
}

function serialize(route: Route): PersistedRoute {
  return {
    ...route,
    metadata: route.metadata
      ? {
          ...route.metadata,
          createdAt: route.metadata.createdAt?.toISOString(),
          updatedAt: route.metadata.updatedAt?.toISOString(),
        }
      : undefined,
  };
}

export class LocalStorageRouteRepository implements RouteRepository {
  private readonly key = KEY;

  async save(route: Route): Promise<void> {
    const all = await this.findAll();
    const map = new Map(all.map((r) => [r.id, r]));
    map.set(route.id, route);
    const json = JSON.stringify(Array.from(map.values()).map(serialize));
    localStorage.setItem(this.key, json);
  }

  async findById(id: string): Promise<Route | null> {
    const all = await this.findAll();
    return all.find((r) => r.id === id) ?? null;
  }

  async findAll(): Promise<Route[]> {
    const raw = localStorage.getItem(this.key);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw) as PersistedRoute[];
      return arr.map(revive);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const all = await this.findAll();
    const next = all.filter((r) => r.id !== id);
    localStorage.setItem(this.key, JSON.stringify(next.map(serialize)));
  }

  async saveAll(routes: Map<string, Route>): Promise<void> {
    const serialized = JSON.stringify(Array.from(routes.entries()));
    localStorage.setItem(this.key, serialized);
  }

  async loadAll(): Promise<Map<string, Route>> {
    const data = localStorage.getItem(this.key);
    if (!data) return new Map();
    try {
      const parsed = JSON.parse(data) as [string, Route][];
      return new Map(parsed);
    } catch {
      return new Map();
    }
  }
}
