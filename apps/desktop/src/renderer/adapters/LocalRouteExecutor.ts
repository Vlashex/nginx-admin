import type { Route } from "@vlashex/core/domain/Route";
import { stringifyWithoutSecrets } from "@vlashex/core/security/secrets";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecuteOptions, RemoteExecutor } from "@vlashex/transport/RemoteExecutor";

const ROUTES_STORAGE_KEY = "nginx_desktop_routes";

export class LocalRouteExecutor implements RemoteExecutor<RouteCommandMap> {
  async execute<TKey extends keyof RouteCommandMap & string>(
    command: TKey,
    payload: RouteCommandMap[TKey]["req"],
    _options?: RemoteExecuteOptions
  ): Promise<RouteCommandMap[TKey]["res"]> {
    const routes = this.loadRoutes();

    switch (command) {
      case "routes:list": {
        const { includeDisabled = true } = payload as RouteCommandMap["routes:list"]["req"];
        const result = includeDisabled ? routes : routes.filter((route) => route.enabled);
        return { routes: result } as RouteCommandMap[TKey]["res"];
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

        const next = [...routes.filter((item) => item.id !== route.id), route];
        this.saveRoutes(next);
        return { route } as RouteCommandMap[TKey]["res"];
      }
      case "routes:toggle": {
        const { id, enabled } = payload as RouteCommandMap["routes:toggle"]["req"];
        const current = routes.find((route) => route.id === id);
        if (!current) {
          throw new Error(`Route ${id} not found`);
        }

        const route: Route = { ...current, enabled, updatedAt: new Date().toISOString() };
        const next = routes.map((item) => (item.id === id ? route : item));
        this.saveRoutes(next);
        return { route } as RouteCommandMap[TKey]["res"];
      }
      default:
        throw new Error(`Unsupported command: ${String(command)}`);
    }
  }

  private loadRoutes(): Route[] {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(ROUTES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as Route[];
    } catch {
      return [];
    }
  }

  private saveRoutes(routes: Route[]): void {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(ROUTES_STORAGE_KEY, stringifyWithoutSecrets(routes));
  }
}
