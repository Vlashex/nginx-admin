// core/repositories/RouteRepository.ts
import type { Route } from "../entities/types";

export interface RouteRepository {
  save(route: Route): Promise<void>;
  findById(id: string): Promise<Route | null>;
  findAll(): Promise<Route[]>;
  delete(id: string): Promise<void>;
  // saveAll(routes: Map<string, Route>): Promise<void>;
  // loadAll(): Promise<Map<string, Route>>;
}
