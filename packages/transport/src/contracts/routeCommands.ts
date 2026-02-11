import type { Route, RouteDraft, RouteId } from "@vlashex/core/domain/Route";
import type { ExecutorCommandMap } from "../RemoteExecutor";

export type RouteCommandMap = ExecutorCommandMap & {
  "routes:list": { req: { includeDisabled?: boolean }; res: { routes: Route[] } };
  "routes:save": { req: { draft: RouteDraft }; res: { route: Route } };
  "routes:toggle": { req: { id: RouteId; enabled: boolean }; res: { route: Route } };
};
