import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import { CommandRouteGateway } from "./CommandRouteGateway";

// Transitional transport gateway for 1.x.
// TODO(daemon-2.x): replace with daemon API repository once state/revision endpoints exist.
export class SSHRouteRepository extends CommandRouteGateway {
  constructor(executor: RemoteExecutor<RouteCommandMap>) {
    super(executor);
  }
}
