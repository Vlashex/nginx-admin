import { Client, type ConnectConfig } from "ssh2";
export interface SSHConnectionManagerOptions {
    keepaliveInterval?: number;
    keepaliveCountMax?: number;
}
export declare class SSHConnectionManager {
    private readonly config;
    private readonly options;
    private activeClient;
    private connectPromise;
    private shuttingDown;
    constructor(config: ConnectConfig, options?: SSHConnectionManagerOptions);
    getClient(signal?: AbortSignal): Promise<Client>;
    shutdown(): Promise<void>;
    private connect;
    private withAbort;
}
//# sourceMappingURL=SSHConnectionManager.d.ts.map