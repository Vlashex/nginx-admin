import { app, ipcMain } from "electron";
import { redactPotentialSecrets } from "@vlashex/core/security/secrets";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
import {
  BOOTSTRAP_CHECK_HOST_CHANNEL,
  BOOTSTRAP_GET_CONTEXT_CHANNEL,
  BOOTSTRAP_INSTALL_DAEMON_CHANNEL,
  type BootstrapContextResponse,
  type BootstrapCheckHostResponse,
  type BootstrapInstallOptions,
  type BootstrapInstallDaemonResponse,
} from "@vlashex/transport/contracts/bootstrap";
import type { HostMetadata } from "../secrets/SecretsRepository.js";
import { SSHExecutor } from "../ssh/SSHExecutor.js";

interface IpcSuccess<TData> {
  ok: true;
  data: TData;
}

interface IpcFailure {
  ok: false;
  error: { message: string; code: string };
}

type IpcResult<TData> = IpcSuccess<TData> | IpcFailure;

const DEFAULT_INSTALL_SCRIPT_URL = process.env.NGINX_ADMIN_INSTALL_SCRIPT_URL ?? "https://repo/install.sh";
const DEFAULT_SERVICE_NAME = process.env.NGINX_ADMIN_SERVICE_NAME ?? "nginx-admin.service";
const DEFAULT_HEALTH_COMMAND = process.env.NGINX_ADMIN_HEALTHCHECK_COMMAND ?? "nginx-admin status";
const DEFAULT_INSTALL_TIMEOUT_MS = 120_000;
const MIN_INSTALL_TIMEOUT_MS = 5_000;
const MAX_INSTALL_TIMEOUT_MS = 300_000;

interface BootstrapInstallRequest {
  options: BootstrapInstallOptions;
}

const toIpcError = (error: unknown): IpcFailure["error"] => {
  if (error instanceof RemoteExecutionError) {
    return { message: redactPotentialSecrets(error.message), code: error.code };
  }
  if (error instanceof Error) {
    return { message: redactPotentialSecrets(error.message), code: "BOOTSTRAP_FAILED" };
  }
  return { message: "Unhandled bootstrap error", code: "BOOTSTRAP_FAILED" };
};

export const registerBootstrapHandlers = (executor: SSHExecutor, metadata: HostMetadata): void => {
  ipcMain.handle(
    BOOTSTRAP_GET_CONTEXT_CHANNEL,
    async (event): Promise<IpcResult<BootstrapContextResponse>> => {
      const senderFrameUrl = event.senderFrame?.url ?? "";
      if (!isTrustedSender(senderFrameUrl)) {
        return { ok: false, error: { message: "Untrusted sender", code: "UNTRUSTED_SENDER" } };
      }

      return {
        ok: true,
        data: {
          connection: {
            id: metadata.id,
            name: metadata.name,
            host: metadata.host,
            port: metadata.port,
            description: metadata.description,
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt,
            checkedAt: metadata.checkedAt,
            latencyMs: metadata.latencyMs,
            status: metadata.status,
          },
          defaults: {
            installScriptUrl: DEFAULT_INSTALL_SCRIPT_URL,
            serviceName: DEFAULT_SERVICE_NAME,
            healthCommand: DEFAULT_HEALTH_COMMAND,
            timeoutMs: 120_000,
          },
        },
      };
    }
  );

  ipcMain.handle(
    BOOTSTRAP_CHECK_HOST_CHANNEL,
    async (event): Promise<IpcResult<BootstrapCheckHostResponse>> => {
      const senderFrameUrl = event.senderFrame?.url ?? "";
      if (!isTrustedSender(senderFrameUrl)) {
        return { ok: false, error: { message: "Untrusted sender", code: "UNTRUSTED_SENDER" } };
      }

      try {
        const start = Date.now();
        await executor.checkConnection({ timeoutMs: 7_000 });
        return {
          ok: true,
          data: {
            reachable: true,
            checkedAt: new Date().toISOString(),
            latencyMs: Date.now() - start,
          },
        };
      } catch (error) {
        return { ok: false, error: toIpcError(error) };
      }
    }
  );

  ipcMain.handle(
    BOOTSTRAP_INSTALL_DAEMON_CHANNEL,
    async (
      event,
      request: BootstrapInstallRequest
    ): Promise<IpcResult<BootstrapInstallDaemonResponse>> => {
      const senderFrameUrl = event.senderFrame?.url ?? "";
      if (!isTrustedSender(senderFrameUrl)) {
        return { ok: false, error: { message: "Untrusted sender", code: "UNTRUSTED_SENDER" } };
      }

      const timeoutMs = normalizeTimeout(request?.options?.timeoutMs);
      const installScriptUrl = DEFAULT_INSTALL_SCRIPT_URL;
      const serviceName = DEFAULT_SERVICE_NAME;
      const healthCommand = DEFAULT_HEALTH_COMMAND;

      try {
        await executor.runShell(
          `curl -fsSL ${quoteForShell(installScriptUrl)} | sudo bash`,
          { timeoutMs }
        );

        const activeStateRaw = await executor.runShell(
          `systemctl is-active ${quoteForShell(serviceName)}`,
          { timeoutMs: 15_000 }
        );
        const enabledStateRaw = await executor.runShell(
          `systemctl is-enabled ${quoteForShell(serviceName)}`,
          { timeoutMs: 15_000 }
        );
        const healthOutput = await executor.runShell(healthCommand, {
          timeoutMs: 15_000,
        });

        return {
          ok: true,
          data: {
            installedAt: new Date().toISOString(),
            service: {
              name: serviceName,
              active: activeStateRaw.trim() === "active",
              enabled: enabledStateRaw.trim() === "enabled",
              activeStateRaw: activeStateRaw.trim(),
              enabledStateRaw: enabledStateRaw.trim(),
            },
            health: {
              ok: true,
              output: redactPotentialSecrets(healthOutput.trim()),
            },
          },
        };
      } catch (error) {
        return { ok: false, error: toIpcError(error) };
      }
    }
  );
};

const quoteForShell = (value: string): string => `'${value.replace(/'/g, `'\"'\"'`)}'`;

const normalizeTimeout = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_INSTALL_TIMEOUT_MS;
  }
  return Math.min(MAX_INSTALL_TIMEOUT_MS, Math.max(MIN_INSTALL_TIMEOUT_MS, Math.trunc(value)));
};

const isTrustedSender = (frameUrl: string): boolean => {
  if (!frameUrl) {
    return false;
  }

  if (app.isPackaged) {
    return frameUrl.startsWith("file://");
  }

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (!devUrl) {
    return frameUrl.startsWith("file://");
  }

  try {
    const allowed = new URL(devUrl);
    const actual = new URL(frameUrl);
    return allowed.origin === actual.origin;
  } catch {
    return false;
  }
};
