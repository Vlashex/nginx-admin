import { RoutesProcess } from "@vlashex/app/processes/RoutesProcess";
import { createTransitionalRouteGateway } from "@vlashex/infra/repositories/createTransitionalRouteGateway";
import { LocalRouteExecutor } from "../adapters/LocalRouteExecutor.js";
import { createRoutesProjectionAdapter } from "../projection/routesProjectionAdapter.js";

export const composeRoutesProcess = (): RoutesProcess => {
  const executor = new LocalRouteExecutor();
  // TODO(daemon-2.x): route renderer through daemon API; keep desktop local until daemon bootstrap is introduced.
  const repository = createTransitionalRouteGateway(executor);
  const projection = createRoutesProjectionAdapter();

  return new RoutesProcess(repository, projection);
};
