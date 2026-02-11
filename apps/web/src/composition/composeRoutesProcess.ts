import { RoutesProcess } from "@vlashex/app/processes/RoutesProcess";
import { SSHRouteRepository } from "@vlashex/infra/repositories/SSHRouteRepository";
import { HttpExecutor } from "../adapters/HttpExecutor";
import { MockExecutor } from "../adapters/MockExecutor";
import { createRoutesProjectionAdapter } from "../projection/routesProjectionAdapter";

export interface WebCompositionOptions {
  transport: "http" | "mock";
  apiBaseUrl?: string;
}

export const composeRoutesProcess = (options: WebCompositionOptions): RoutesProcess => {
  const executor = options.transport === "http" ? new HttpExecutor(options.apiBaseUrl ?? "/api") : new MockExecutor();

  const repository = new SSHRouteRepository(executor);
  const projection = createRoutesProjectionAdapter();

  return new RoutesProcess(repository, projection);
};
