import type { Route } from "@vlashex/core/domain/Route";

export interface RoutesProjection {
  setPending(pending: boolean): void;
  setError(message: string | null): void;
  replaceRoutes(routes: Route[]): void;
  upsertRoute(route: Route): void;
}
