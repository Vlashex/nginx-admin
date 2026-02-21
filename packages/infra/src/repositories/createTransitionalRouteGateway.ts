import type { RouteGateway } from "@vlashex/core/ports/RouteGateway";
import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import { SSHRouteRepository } from "./SSHRouteRepository";

export const createTransitionalRouteGateway = (
  executor: RemoteExecutor<RouteCommandMap>
): RouteGateway => {
  // TODO(daemon-2.x): route through daemon state/runtime API transport instead of SSH.
  return new SSHRouteRepository(executor);
};
