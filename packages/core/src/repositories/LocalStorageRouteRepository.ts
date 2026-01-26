// core/repositories/LocalStorageRouteRepository.ts
import type { RouteRepository } from "../repositories/RouteRepository";
import type { Route } from "../entities/types";

export class LocalStorageRouteRepository implements RouteRepository {
  private readonly key = "nginx_routes";

  async save(route: Route): Promise<void> {
    const all = await this.loadAll();
    all.set(route.id, route);
    const next = new Map(all);
    await this.saveAll(next);
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
    const next = new Map(all);
    await this.saveAll(next);
  }

  async saveAll(routes: Map<string, Route>): Promise<void> {
    localStorage.setItem(
      this.key,
      JSON.stringify(Array.from(routes.entries()))
    );
  }

  async loadAll(): Promise<Map<string, Route>> {
    const raw = localStorage.getItem(this.key);
    if (!raw) return new Map();

    try {
      const entries = JSON.parse(raw) as [string, Route][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  }
}
