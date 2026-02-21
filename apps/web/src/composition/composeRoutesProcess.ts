import { RoutesProcess } from "@vlashex/app/processes/RoutesProcess";
import { createTransitionalRouteGateway } from "@vlashex/infra/repositories/createTransitionalRouteGateway";
import { HttpExecutor } from "../adapters/HttpExecutor";
import { MockExecutor } from "../adapters/MockExecutor";
import { createRoutesProjectionAdapter } from "../projection/routesProjectionAdapter";

export interface WebCompositionOptions {
  transport: "http" | "mock";
  apiBaseUrl?: string;
}

export const composeRoutesProcess = (options: WebCompositionOptions): RoutesProcess => {
  const executor = options.transport === "http" ? new HttpExecutor(options.apiBaseUrl ?? "/api") : new MockExecutor();
  // TODO(daemon-2.x): swap transitional transport gateway for daemon state/runtime API gateway.
  const repository = createTransitionalRouteGateway(executor);
  const projection = createRoutesProjectionAdapter();

  return new RoutesProcess(repository, projection);
};
