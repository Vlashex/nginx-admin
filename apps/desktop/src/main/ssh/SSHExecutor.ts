import type { Client, ClientChannel, ConnectConfig } from "ssh2";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecuteOptions, RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
import { SSHConnectionManager, type SSHConnectionManagerOptions } from "./SSHConnectionManager.js";

export interface SSHExecutorConfig extends ConnectConfig {
  cliPath: string;
}

export interface SSHExecutorOptions extends SSHConnectionManagerOptions {
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

type RouteCommand = keyof RouteCommandMap & string;
const CONNECT_FAILED_CODE = "SSH_CONNECT_FAILED";
const ABORTED_CODE = "ABORTED";

export class SSHExecutor implements RemoteExecutor<RouteCommandMap> {
  private readonly connectionManager: SSHConnectionManager;
  private readonly cliPath: string;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly logPrefix = "[ssh][executor]";

  constructor(config: SSHExecutorConfig, options: SSHExecutorOptions = {}) {
    const { cliPath, ...sshConfig } = config;
    this.cliPath = cliPath;
    this.connectionManager = new SSHConnectionManager(sshConfig, options);
    this.maxRetries = options.maxRetries ?? 1;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 250;
  }

  async execute<TKey extends RouteCommand>(
    command: TKey,
    payload: RouteCommandMap[TKey]["req"],
    options?: RemoteExecuteOptions
  ): Promise<RouteCommandMap[TKey]["res"]> {
    this.log("info", "Preparing remote command execution", {
      command,
      timeoutMs: options?.timeoutMs ?? 10_000,
    });
    const serialized = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    const remoteCommand = `${this.cliPath} ${command} ${serialized}`;
    const output = await this.execWithRetry(command, remoteCommand, options);
    try {
      const parsed = JSON.parse(output) as RouteCommandMap[TKey]["res"];
      this.log("info", "Remote command execution completed", { command });
      return parsed;
    } catch {
      throw new RemoteExecutionError("Invalid JSON from SSH target", "BAD_REMOTE_PAYLOAD", output);
    }
  }

  async checkConnection(options?: RemoteExecuteOptions): Promise<void> {
    const marker = "__nginx_admin_ssh_ok__";
    const client = await this.connectionManager.getClient(options?.signal);
    const output = await this.execOnClient(client, `echo ${marker}`, options);
    if (output !== marker) {
      throw new RemoteExecutionError(`Unexpected SSH health-check output: ${output}`, "SSH_HEALTHCHECK_FAILED");
    }
    this.log("info", "SSH health check completed successfully");
  }

  async runShell(command: string, options?: RemoteExecuteOptions): Promise<string> {
    this.log("info", "Executing bootstrap shell command", {
      timeoutMs: options?.timeoutMs ?? 30_000,
    });
    return this.execWithRetry("shell", command, options);
  }

  async shutdown(): Promise<void> {
    await this.connectionManager.shutdown();
  }

  private async execWithRetry(
    commandName: string,
    command: string,
    options?: RemoteExecuteOptions
  ): Promise<string> {
    let attempt = 0;
    let lastError: unknown;
    const totalAttempts = this.maxRetries + 1;

    while (attempt < totalAttempts) {
      attempt += 1;
      try {
        this.log("info", "Executing over SSH", { command: commandName, attempt, totalAttempts });
        const client = await this.connectionManager.getClient(options?.signal);
        return await this.execOnClient(client, command, options);
      } catch (error) {
        this.log("warn", "SSH execution attempt failed", {
          command: commandName,
          attempt,
          totalAttempts,
          error: error instanceof Error ? error.message : String(error),
        });
        lastError = error;
        if (!this.shouldRetry(error, attempt, totalAttempts)) {
          this.log("error", "SSH execution failed with no retries left", {
            command: commandName,
            attempt,
            totalAttempts,
          });
          throw error;
        }
        this.log("info", "Retrying SSH execution with backoff", {
          command: commandName,
          delayMs: this.retryBaseDelayMs * 2 ** (attempt - 1),
        });
        await this.delay(this.retryBaseDelayMs * 2 ** (attempt - 1), options?.signal);
      }
    }

    throw (lastError instanceof Error
      ? lastError
      : new RemoteExecutionError("SSH execution failed", "SSH_EXEC_FAILED"));
  }

  private execOnClient(client: Client, command: string, options?: RemoteExecuteOptions): Promise<string> {
    const timeoutMs = options?.timeoutMs ?? 10_000;

    return new Promise((resolve, reject) => {
      let streamRef: ClientChannel | null = null;
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const cleanup = (): void => {
        if (timer) {
          clearTimeout(timer);
        }
        options?.signal?.removeEventListener("abort", onAbort);
      };

      const rejectOnce = (error: RemoteExecutionError): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(error);
      };

      const resolveOnce = (output: string): void => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve(output);
      };

      const abortStream = (): void => {
        if (!streamRef) {
          return;
        }
        streamRef.close();
        streamRef.end();
      };

      const onAbort = (): void => {
        this.log("warn", "SSH command aborted");
        abortStream();
        rejectOnce(new RemoteExecutionError("Operation aborted", ABORTED_CODE));
      };

      if (options?.signal?.aborted) {
        onAbort();
        return;
      }

      options?.signal?.addEventListener("abort", onAbort, { once: true });

      timer = setTimeout(() => {
        this.log("warn", "SSH command timed out", { timeoutMs });
        abortStream();
        rejectOnce(new RemoteExecutionError("SSH command timed out", "SSH_TIMEOUT"));
      }, timeoutMs);

      client.exec(command, (execErr: Error | undefined, stream: ClientChannel) => {
        if (execErr) {
          this.log("error", "Failed to open SSH exec channel", { message: execErr.message });
          rejectOnce(new RemoteExecutionError(execErr.message, "SSH_EXEC_OPEN_FAILED"));
          return;
        }

        streamRef = stream;
        let stdout = "";
        let stderr = "";

        stream.on("data", (chunk: Buffer) => {
          stdout += chunk.toString("utf8");
        });

        stream.stderr.on("data", (chunk: Buffer) => {
          stderr += chunk.toString("utf8");
        });

        stream.on("close", (code: number) => {
          if (code !== 0) {
            const parsedError = this.parseRemoteError(stderr);
            this.log("error", "SSH command exited with non-zero code", {
              code,
              stderr: stderr.trim(),
            });
            rejectOnce(
              parsedError
                ? new RemoteExecutionError(parsedError.message, parsedError.code)
                : new RemoteExecutionError(stderr || `SSH exited with code ${code}`, "SSH_NON_ZERO")
            );
            return;
          }

          this.log("info", "SSH command stream closed successfully");
          resolveOnce(stdout.trim());
        });
      });
    });
  }

  private parseRemoteError(stderr: string): { message: string; code: string } | null {
    const raw = stderr.trim();
    if (!raw.startsWith("{")) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "message" in parsed &&
        "code" in parsed &&
        typeof parsed.message === "string" &&
        typeof parsed.code === "string"
      ) {
        return { message: parsed.message, code: parsed.code };
      }
    } catch {
      return null;
    }

    return null;
  }

  private shouldRetry(error: unknown, attempt: number, totalAttempts: number): boolean {
    if (attempt >= totalAttempts) {
      return false;
    }

    return error instanceof RemoteExecutionError && error.code === CONNECT_FAILED_CODE;
  }

  private async delay(ms: number, signal?: AbortSignal): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const onAbort = (): void => {
        clearTimeout(timer);
        this.log("warn", "SSH retry delay aborted");
        reject(new RemoteExecutionError("Operation aborted", ABORTED_CODE));
      };

      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, ms);

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }

  private log(level: "info" | "warn" | "error", message: string, meta?: unknown): void {
    if (meta === undefined) {
      console[level](`${this.logPrefix} ${message}`);
      return;
    }

    console[level](`${this.logPrefix} ${message}`, meta);
  }
}
