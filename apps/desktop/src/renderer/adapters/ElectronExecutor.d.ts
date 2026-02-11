import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
export declare class ElectronExecutor implements RemoteExecutor<RouteCommandMap> {
    execute<TKey extends keyof RouteCommandMap & string>(command: TKey, payload: RouteCommandMap[TKey]["req"]): Promise<RouteCommandMap[TKey]["res"]>;
}
//# sourceMappingURL=ElectronExecutor.d.ts.map