import { Client, type ConnectConfig } from "ssh2";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";

export interface SSHConnectionManagerOptions {
  keepaliveInterval?: number;
  keepaliveCountMax?: number;
}

const ABORTED_CODE = "ABORTED";
const CONNECT_FAILED_CODE = "SSH_CONNECT_FAILED";
const SHUTTING_DOWN_CODE = "SSH_SHUTTING_DOWN";

export class SSHConnectionManager {
  private activeClient: Client | null = null;
  private connectPromise: Promise<Client> | null = null;
  private shuttingDown = false;
  private readonly logPrefix = "[ssh][manager]";

  constructor(
    private readonly config: ConnectConfig,
    private readonly options: SSHConnectionManagerOptions = {}
  ) {}

  async getClient(signal?: AbortSignal): Promise<Client> {
    if (this.shuttingDown) {
      this.log("warn", "Client requested during shutdown");
      throw new RemoteExecutionError("SSH connection manager is shutting down", SHUTTING_DOWN_CODE);
    }

    if (this.activeClient) {
      this.log("info", "Reusing active SSH client");
      return this.activeClient;
    }

    if (!this.connectPromise) {
      this.log("info", "Creating new SSH connection", this.getConnectionMeta());
      this.connectPromise = this.connect(signal).finally(() => {
        this.connectPromise = null;
      });
    } else {
      this.log("info", "Waiting for in-flight SSH connection attempt");
    }

    return this.withAbort(this.connectPromise, signal);
  }

  async shutdown(): Promise<void> {
    this.shuttingDown = true;
    const client = this.activeClient;
    this.activeClient = null;

    if (!client) {
      this.log("info", "Shutdown requested with no active SSH client");
      this.shuttingDown = false;
      return;
    }

    this.log("info", "Shutting down active SSH client");
    await new Promise<void>((resolve) => {
      let settled = false;
      const complete = (): void => {
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

    this.log("info", "SSH client shutdown complete");
    this.shuttingDown = false;
  }

  private connect(signal?: AbortSignal): Promise<Client> {
    return new Promise((resolve, reject) => {
      const client = new Client();
      let settled = false;

      const cleanup = (): void => {
        signal?.removeEventListener("abort", onAbort);
        client.removeListener("ready", onReady);
        client.removeListener("error", onError);
      };

      const onAbort = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        this.log("warn", "SSH connect aborted by signal");
        cleanup();
        client.end();
        reject(new RemoteExecutionError("Operation aborted", ABORTED_CODE));
      };

      const onReady = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        this.activeClient = client;
        this.log("info", "SSH connection is ready", this.getConnectionMeta());
        client.on("error", () => {
          this.log("warn", "Active SSH client emitted error and was invalidated");
          if (this.activeClient === client) {
            this.activeClient = null;
          }
        });
        client.on("close", () => {
          this.log("info", "Active SSH client closed and was invalidated");
          if (this.activeClient === client) {
            this.activeClient = null;
          }
        });
        cleanup();
        resolve(client);
      };

      const onError = (error: Error): void => {
        if (settled) {
          if (this.activeClient === client) {
            this.activeClient = null;
          }
          return;
        }
        settled = true;
        this.log("error", "SSH connection failed", { message: error.message });
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

  private async withAbort<T>(task: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) {
      return task;
    }
    if (signal.aborted) {
      throw new RemoteExecutionError("Operation aborted", ABORTED_CODE);
    }

    return new Promise<T>((resolve, reject) => {
      const onAbort = (): void => {
        this.log("warn", "Pending SSH operation aborted by signal");
        reject(new RemoteExecutionError("Operation aborted", ABORTED_CODE));
      };
      signal.addEventListener("abort", onAbort, { once: true });

      task
        .then((result) => {
          signal.removeEventListener("abort", onAbort);
          resolve(result);
        })
        .catch((error: unknown) => {
          signal.removeEventListener("abort", onAbort);
          reject(error);
      });
    });
  }

  private getConnectionMeta(): { host?: string; port?: number; keepaliveInterval?: number; keepaliveCountMax?: number } {
    return {
      host: this.config.host,
      port: this.config.port,
      keepaliveInterval: this.options.keepaliveInterval ?? this.config.keepaliveInterval ?? 15_000,
      keepaliveCountMax: this.options.keepaliveCountMax ?? this.config.keepaliveCountMax ?? 3,
    };
  }

  private log(level: "info" | "warn" | "error", message: string, meta?: unknown): void {
    if (meta === undefined) {
      console[level](`${this.logPrefix} ${message}`);
      return;
    }

    console[level](`${this.logPrefix} ${message}`, meta);
  }
}
