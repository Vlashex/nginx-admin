import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";

export class ElectronExecutor implements RemoteExecutor<RouteCommandMap> {
  async execute<TKey extends keyof RouteCommandMap & string>(
    command: TKey,
    payload: RouteCommandMap[TKey]["req"]
  ): Promise<RouteCommandMap[TKey]["res"]> {
    const result = await window.remoteBridge.execute({ command, payload });
    if (!result.ok) {
      throw new RemoteExecutionError(result.error.message, result.error.code, result.error.details);
    }
    return result.data as RouteCommandMap[TKey]["res"];
  }
}
