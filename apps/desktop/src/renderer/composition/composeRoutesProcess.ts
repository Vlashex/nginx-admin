import { RoutesProcess } from "@vlashex/app/processes/RoutesProcess";
import { SSHRouteRepository } from "@vlashex/infra/repositories/SSHRouteRepository";
import { ElectronExecutor } from "../adapters/ElectronExecutor";
import { createRoutesProjectionAdapter } from "../projection/routesProjectionAdapter";

export const composeRoutesProcess = (): RoutesProcess => {
  const executor = new ElectronExecutor();
  const repository = new SSHRouteRepository(executor);
  const projection = createRoutesProjectionAdapter();

  return new RoutesProcess(repository, projection);
};
