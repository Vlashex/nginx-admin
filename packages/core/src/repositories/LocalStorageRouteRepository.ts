// core/repositories/LocalStorageRouteRepository.ts
import type { RouteRepository } from "../repositories/RouteRepository";
import type { Route } from "../entities/types";

export class LocalStorageRouteRepository implements RouteRepository {
  private readonly key = "nginx_routes";

  async save(route: Route): Promise<void> {
    const all = await this.loadAll();
    all.set(route.id, route);
    await this.saveAll(all);
  }

  async findById(id: string): Promise<Route | null> {
    const all = await this.loadAll();
    return all.get(id) || null;
  }

  async findAll(): Promise<Route[]> {
    const all = await this.loadAll();
    return Array.from(all.values());
  }

  async delete(id: string): Promise<void> {
    const all = await this.loadAll();
    all.delete(id);
    await this.saveAll(all);
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
