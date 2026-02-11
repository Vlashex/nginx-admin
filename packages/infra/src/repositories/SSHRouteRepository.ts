import type { RouteGateway } from "@vlashex/core/ports/RouteGateway";
import type { Route, RouteDraft, RouteId } from "@vlashex/core/domain/Route";
import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";

export class SSHRouteRepository implements RouteGateway {
  constructor(private readonly executor: RemoteExecutor<RouteCommandMap>) {}

  async list(input: { includeDisabled?: boolean } = {}): Promise<Route[]> {
    const { routes } = await this.executor.execute("routes:list", {
      includeDisabled: input.includeDisabled ?? true,
    });
    return routes;
  }

  async save(input: RouteDraft): Promise<Route> {
    const { route } = await this.executor.execute("routes:save", { draft: input });
    return route;
  }

  async toggle(input: { id: RouteId; enabled: boolean }): Promise<Route> {
    const { route } = await this.executor.execute("routes:toggle", input);
    return route;
  }
}
