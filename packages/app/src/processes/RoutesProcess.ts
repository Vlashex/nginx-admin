import type { RouteDraft, RouteId } from "@vlashex/core/domain/Route";
import type { RouteGateway } from "@vlashex/core/ports/RouteGateway";
import type { RoutesProjection } from "../projections/RoutesProjection";

export class RoutesProcess {
  constructor(
    private readonly routeRepository: RouteGateway,
    private readonly projection: RoutesProjection
  ) {}

  async load(includeDisabled = true): Promise<void> {
    this.projection.setPending(true);
    this.projection.setError(null);
    try {
      const routes = await this.routeRepository.list({ includeDisabled });
      this.projection.replaceRoutes(routes);
    } catch (error) {
      this.projection.setError(error instanceof Error ? error.message : "Failed to load routes");
      throw error;
    } finally {
      this.projection.setPending(false);
    }
  }

  async save(draft: RouteDraft): Promise<void> {
    this.projection.setPending(true);
    this.projection.setError(null);
    try {
      const route = await this.routeRepository.save(draft);
      this.projection.upsertRoute(route);
    } catch (error) {
      this.projection.setError(error instanceof Error ? error.message : "Failed to save route");
      throw error;
    } finally {
      this.projection.setPending(false);
    }
  }

  async toggle(id: RouteId, enabled: boolean): Promise<void> {
    this.projection.setPending(true);
    this.projection.setError(null);
    try {
      const route = await this.routeRepository.toggle({ id, enabled });
      this.projection.upsertRoute(route);
    } catch (error) {
      this.projection.setError(error instanceof Error ? error.message : "Failed to toggle route");
      throw error;
    } finally {
      this.projection.setPending(false);
    }
  }
}
