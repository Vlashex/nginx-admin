import { Client } from "ssh2";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
const ABORTED_CODE = "ABORTED";
const CONNECT_FAILED_CODE = "SSH_CONNECT_FAILED";
const SHUTTING_DOWN_CODE = "SSH_SHUTTING_DOWN";
export class SSHConnectionManager {
    config;
    options;
    activeClient = null;
    connectPromise = null;
    shuttingDown = false;
    constructor(config, options = {}) {
        this.config = config;
        this.options = options;
    }
    async getClient(signal) {
        if (this.shuttingDown) {
            throw new RemoteExecutionError("SSH connection manager is shutting down", SHUTTING_DOWN_CODE);
        }
        if (this.activeClient) {
            return this.activeClient;
        }
        if (!this.connectPromise) {
            this.connectPromise = this.connect(signal).finally(() => {
                this.connectPromise = null;
            });
        }
        return this.withAbort(this.connectPromise, signal);
    }
    async shutdown() {
        this.shuttingDown = true;
        const client = this.activeClient;
        this.activeClient = null;
        if (!client) {
            this.shuttingDown = false;
            return;
        }
        await new Promise((resolve) => {
            let settled = false;
            const complete = () => {
                if (settled) {
                    return;
                }
                settled = true;
                resolve();
            };
            const timer = setTimeout(complete, 1_000);
            client.once("close", () => {
                clearTimeout(timer);
                complete();
            });
            client.end();
        });
        this.shuttingDown = false;
    }
    connect(signal) {
        return new Promise((resolve, reject) => {
            const client = new Client();
            let settled = false;
            const cleanup = () => {
                signal?.removeEventListener("abort", onAbort);
                client.removeListener("ready", onReady);
                client.removeListener("error", onError);
            };
            const onAbort = () => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                client.end();
                reject(new RemoteExecutionError("Operation aborted", ABORTED_CODE));
            };
            const onReady = () => {
                if (settled) {
                    return;
                }
                settled = true;
                this.activeClient = client;
                client.on("error", () => {
                    if (this.activeClient === client) {
                        this.activeClient = null;
                    }
                });
                client.on("close", () => {
                    if (this.activeClient === client) {
                        this.activeClient = null;
                    }
                });
                cleanup();
                resolve(client);
            };
            const onError = (error) => {
                if (settled) {
                    if (this.activeClient === client) {
                        this.activeClient = null;
                    }
                    return;
                }
                settled = true;
                cleanup();
                reject(new RemoteExecutionError(error.message, CONNECT_FAILED_CODE));
            };
            if (signal?.aborted) {
                onAbort();
                return;
            }
            signal?.addEventListener("abort", onAbort, { once: true });
            client.once("ready", onReady);
            client.once("error", onError);
            client.connect({
                ...this.config,
                keepaliveInterval: this.options.keepaliveInterval ?? this.config.keepaliveInterval ?? 15_000,
                keepaliveCountMax: this.options.keepaliveCountMax ?? this.config.keepaliveCountMax ?? 3,
            });
        });
    }
    async withAbort(task, signal) {
        if (!signal) {
            return task;
        }
        if (signal.aborted) {
            throw new RemoteExecutionError("Operation aborted", ABORTED_CODE);
        }
        return new Promise((resolve, reject) => {
            const onAbort = () => {
                reject(new RemoteExecutionError("Operation aborted", ABORTED_CODE));
            };
            signal.addEventListener("abort", onAbort, { once: true });
            task
                .then((result) => {
                signal.removeEventListener("abort", onAbort);
                resolve(result);
            })
                .catch((error) => {
                signal.removeEventListener("abort", onAbort);
                reject(error);
            });
        });
    }
}
