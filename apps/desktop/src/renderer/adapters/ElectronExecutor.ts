import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecuteOptions, RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";

export class ElectronExecutor implements RemoteExecutor<RouteCommandMap> {
  async execute<TKey extends keyof RouteCommandMap & string>(
    command: TKey,
    payload: RouteCommandMap[TKey]["req"],
    options?: RemoteExecuteOptions
  ): Promise<RouteCommandMap[TKey]["res"]> {
    const result = await window.remoteBridge.execute(command, payload, options);
    if (!result.ok) {
      throw new RemoteExecutionError(result.error.message, result.error.code);
    }
    return result.data;
  }
}
