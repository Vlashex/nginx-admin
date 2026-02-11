import type { Route, RouteDraft, RouteId } from "../domain/Route";

export interface RouteGateway {
  list(input?: { includeDisabled?: boolean }): Promise<Route[]>;
  save(input: RouteDraft): Promise<Route>;
  toggle(input: { id: RouteId; enabled: boolean }): Promise<Route>;
}
