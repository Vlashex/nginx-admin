import type { ConnectConfig } from "ssh2";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecuteOptions, RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import { type SSHConnectionManagerOptions } from "./SSHConnectionManager";
export interface SSHExecutorConfig extends ConnectConfig {
    cliPath: string;
}
export interface SSHExecutorOptions extends SSHConnectionManagerOptions {
    maxRetries?: number;
    retryBaseDelayMs?: number;
}
type RouteCommand = keyof RouteCommandMap & string;
export declare class SSHExecutor implements RemoteExecutor<RouteCommandMap> {
    private readonly connectionManager;
    private readonly cliPath;
    private readonly maxRetries;
    private readonly retryBaseDelayMs;
    constructor(config: SSHExecutorConfig, options?: SSHExecutorOptions);
    execute<TKey extends RouteCommand>(command: TKey, payload: RouteCommandMap[TKey]["req"], options?: RemoteExecuteOptions): Promise<RouteCommandMap[TKey]["res"]>;
    shutdown(): Promise<void>;
    private execWithRetry;
    private execOnClient;
    private parseRemoteError;
    private shouldRetry;
    private delay;
}
export {};
//# sourceMappingURL=SSHExecutor.d.ts.map