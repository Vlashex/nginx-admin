import type { Route, RouteRepository } from "@vlashex/core";
import { stringifyWithoutSecrets } from "./safeJson";

type PersistedRoute = Omit<Route, "metadata"> & {
  metadata?: Route["metadata"] extends infer TMetadata
    ? TMetadata extends object
      ? Omit<TMetadata, "createdAt" | "updatedAt"> & {
          createdAt?: string;
          updatedAt?: string;
        }
      : never
    : never;
};

const ROUTES_STORAGE_KEY = "nginx_routes";

const toPersistedRoute = (route: Route): PersistedRoute => ({
  ...route,
  metadata: route.metadata
    ? {
        ...route.metadata,
        createdAt: route.metadata.createdAt?.toISOString(),
        updatedAt: route.metadata.updatedAt?.toISOString(),
      }
    : undefined,
});

const fromPersistedRoute = (route: PersistedRoute): Route => ({
  ...route,
  metadata: route.metadata
    ? {
        ...route.metadata,
        createdAt: route.metadata.createdAt ? new Date(route.metadata.createdAt) : new Date(),
        updatedAt: route.metadata.updatedAt ? new Date(route.metadata.updatedAt) : new Date(),
      }
    : undefined,
});

export class BrowserLocalStorageRouteRepository implements RouteRepository {
  constructor(private readonly key: string = ROUTES_STORAGE_KEY) {}

  async save(route: Route): Promise<void> {
    const all = await this.findAll();
    const map = new Map(all.map((item) => [item.id, item]));
    map.set(route.id, route);
    const serialized = stringifyWithoutSecrets(Array.from(map.values()).map(toPersistedRoute));
    localStorage.setItem(this.key, serialized);
  }

  async findById(id: string): Promise<Route | null> {
    const routes = await this.findAll();
    return routes.find((route) => route.id === id) ?? null;
  }

  async findAll(): Promise<Route[]> {
    const raw = localStorage.getItem(this.key);
    if (!raw) {
      return [];
    }

    try {
      const routes = JSON.parse(raw) as PersistedRoute[];
      return routes.map(fromPersistedRoute);
    } catch {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    const routes = await this.findAll();
    const remaining = routes.filter((route) => route.id !== id);
    localStorage.setItem(this.key, stringifyWithoutSecrets(remaining.map(toPersistedRoute)));
  }

  async saveAll(routes: Map<string, Route>): Promise<void> {
    const serialized = stringifyWithoutSecrets(Array.from(routes.values()).map(toPersistedRoute));
    localStorage.setItem(this.key, serialized);
  }

  async loadAll(): Promise<Map<string, Route>> {
    const routes = await this.findAll();
    return new Map(routes.map((route) => [route.id, route]));
  }
}
