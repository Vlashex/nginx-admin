import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import { type RemoteIpcRequest, type RemoteIpcResult } from "@vlashex/transport/ipc";
export interface PreloadRemoteBridge {
    execute<TKey extends keyof RouteCommandMap & string>(request: RemoteIpcRequest<RouteCommandMap, TKey>): Promise<RemoteIpcResult<RouteCommandMap[TKey]["res"]>>;
}
//# sourceMappingURL=remoteBridge.d.ts.map