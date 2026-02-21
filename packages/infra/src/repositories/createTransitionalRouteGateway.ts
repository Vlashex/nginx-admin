import type { RouteGateway } from "@vlashex/core/ports/RouteGateway";
import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import { CommandRouteGateway } from "./CommandRouteGateway";

export const createTransitionalRouteGateway = (
  executor: RemoteExecutor<RouteCommandMap>
): RouteGateway => {
  // TODO(daemon-2.x): replace command gateway with daemon state/runtime API gateway.
  return new CommandRouteGateway(executor);
};
