import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
import { SSHConnectionManager } from "./SSHConnectionManager";
const CONNECT_FAILED_CODE = "SSH_CONNECT_FAILED";
const ABORTED_CODE = "ABORTED";
export class SSHExecutor {
    connectionManager;
    cliPath;
    maxRetries;
    retryBaseDelayMs;
    constructor(config, options = {}) {
        const { cliPath, ...sshConfig } = config;
        this.cliPath = cliPath;
        this.connectionManager = new SSHConnectionManager(sshConfig, options);
        this.maxRetries = options.maxRetries ?? 1;
        this.retryBaseDelayMs = options.retryBaseDelayMs ?? 250;
    }
    async execute(command, payload, options) {
        const serialized = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
        const remoteCommand = `${this.cliPath} ${command} ${serialized}`;
        const output = await this.execWithRetry(remoteCommand, options);
        try {
            return JSON.parse(output);
        }
        catch {
            throw new RemoteExecutionError("Invalid JSON from SSH target", "BAD_REMOTE_PAYLOAD", output);
        }
    }
    async shutdown() {
        await this.connectionManager.shutdown();
    }
    async execWithRetry(command, options) {
        let attempt = 0;
        let lastError;
        const totalAttempts = this.maxRetries + 1;
        while (attempt < totalAttempts) {
            attempt += 1;
            try {
                const client = await this.connectionManager.getClient(options?.signal);
                return await this.execOnClient(client, command, options);
            }
            catch (error) {
                lastError = error;
                if (!this.shouldRetry(error, attempt, totalAttempts)) {
                    throw error;
                }
                await this.delay(this.retryBaseDelayMs * 2 ** (attempt - 1), options?.signal);
            }
        }
        throw (lastError instanceof Error
            ? lastError
            : new RemoteExecutionError("SSH execution failed", "SSH_EXEC_FAILED"));
    }
    execOnClient(client, command, options) {
        const timeoutMs = options?.timeoutMs ?? 10_000;
        return new Promise((resolve, reject) => {
            let streamRef = null;
            let settled = false;
            let timer;
            const cleanup = () => {
                if (timer) {
                    clearTimeout(timer);
                }
                options?.signal?.removeEventListener("abort", onAbort);
            };
            const rejectOnce = (error) => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                reject(error);
            };
            const resolveOnce = (output) => {
                if (settled) {
                    return;
                }
                settled = true;
                cleanup();
                resolve(output);
            };
            const abortStream = () => {
                if (!streamRef) {
                    return;
                }
                streamRef.close();
                streamRef.end();
            };
            const onAbort = () => {
                abortStream();
                rejectOnce(new RemoteExecutionError("Operation aborted", ABORTED_CODE));
            };
            if (options?.signal?.aborted) {
                onAbort();
                return;
            }
            options?.signal?.addEventListener("abort", onAbort, { once: true });
            timer = setTimeout(() => {
                abortStream();
                rejectOnce(new RemoteExecutionError("SSH command timed out", "SSH_TIMEOUT"));
            }, timeoutMs);
            client.exec(command, (execErr, stream) => {
                if (execErr) {
                    rejectOnce(new RemoteExecutionError(execErr.message, "SSH_EXEC_OPEN_FAILED"));
                    return;
                }
                streamRef = stream;
                let stdout = "";
                let stderr = "";
                stream.on("data", (chunk) => {
                    stdout += chunk.toString("utf8");
                });
                stream.stderr.on("data", (chunk) => {
                    stderr += chunk.toString("utf8");
                });
                stream.on("close", (code) => {
                    if (code !== 0) {
                        const parsedError = this.parseRemoteError(stderr);
                        rejectOnce(parsedError
                            ? new RemoteExecutionError(parsedError.message, parsedError.code)
                            : new RemoteExecutionError(stderr || `SSH exited with code ${code}`, "SSH_NON_ZERO"));
                        return;
                    }
                    resolveOnce(stdout.trim());
                });
            });
        });
    }
    parseRemoteError(stderr) {
        const raw = stderr.trim();
        if (!raw.startsWith("{")) {
            return null;
        }
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "object" &&
                parsed !== null &&
                "message" in parsed &&
                "code" in parsed &&
                typeof parsed.message === "string" &&
                typeof parsed.code === "string") {
                return { message: parsed.message, code: parsed.code };
            }
        }
        catch {
            return null;
        }
        return null;
    }
    shouldRetry(error, attempt, totalAttempts) {
        if (attempt >= totalAttempts) {
            return false;
        }
        return error instanceof RemoteExecutionError && error.code === CONNECT_FAILED_CODE;
    }
    async delay(ms, signal) {
        await new Promise((resolve, reject) => {
            const onAbort = () => {
                clearTimeout(timer);
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
}
