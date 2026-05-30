import type { Route } from "@vlashex/core/domain/Route";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";

export class MockExecutor implements RemoteExecutor<RouteCommandMap> {
  private routes: Route[] = [];

  async execute<TKey extends keyof RouteCommandMap & string>(
    command: TKey,
    payload: RouteCommandMap[TKey]["req"]
  ): Promise<RouteCommandMap[TKey]["res"]> {
    switch (command) {
      case "routes:list": {
        const { includeDisabled = true } = payload as RouteCommandMap["routes:list"]["req"];
        const routes = includeDisabled ? [...this.routes] : this.routes.filter((route) => route.enabled);
        return { routes } as RouteCommandMap[TKey]["res"];
      }
      case "routes:save": {
        const draft = (payload as RouteCommandMap["routes:save"]["req"]).draft;
        const route: Route = {
          id: draft.id ?? crypto.randomUUID(),
          host: draft.host,
          destination: draft.destination,
          enabled: draft.enabled ?? true,
          updatedAt: new Date().toISOString(),
        };
        this.routes = [...this.routes.filter((r) => r.id !== route.id), route];
        return { route } as RouteCommandMap[TKey]["res"];
      }
      case "routes:toggle": {
        const { id, enabled } = payload as RouteCommandMap["routes:toggle"]["req"];
        const current = this.routes.find((r) => r.id === id);
        if (!current) {
          throw new Error(`Route ${id} not found`);
        }
        const route = { ...current, enabled, updatedAt: new Date().toISOString() };
        this.routes = this.routes.map((r) => (r.id === id ? route : r));
        return { route } as RouteCommandMap[TKey]["res"];
      }
      default:
        throw new Error(`Unsupported command: ${String(command)}`);
    }
  }
}
