import { RoutesProcess } from "@vlashex/app/processes/RoutesProcess";
import { createTransitionalRouteGateway } from "@vlashex/infra/repositories/createTransitionalRouteGateway";
import { ElectronExecutor } from "../adapters/ElectronExecutor.js";
import { createRoutesProjectionAdapter } from "../projection/routesProjectionAdapter.js";

export const composeRoutesProcess = (): RoutesProcess => {
  const executor = new ElectronExecutor();
  // TODO(daemon-2.x): use daemon API transport after bootstrap; keep SSH as transitional 1.x only.
  const repository = createTransitionalRouteGateway(executor);
  const projection = createRoutesProjectionAdapter();

  return new RoutesProcess(repository, projection);
};
