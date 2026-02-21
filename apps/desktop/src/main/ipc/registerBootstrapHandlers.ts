import { app, ipcMain } from "electron";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
import {
  BOOTSTRAP_CHECK_HOST_CHANNEL,
  BOOTSTRAP_INSTALL_DAEMON_CHANNEL,
  type BootstrapCheckHostResponse,
  type BootstrapInstallDaemonResponse,
} from "@vlashex/transport/contracts/bootstrap";
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

const toIpcError = (error: unknown): IpcFailure["error"] => {
  if (error instanceof RemoteExecutionError) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    return { message: error.message, code: "BOOTSTRAP_FAILED" };
  }
  return { message: "Unhandled bootstrap error", code: "BOOTSTRAP_FAILED" };
};

export const registerBootstrapHandlers = (executor: SSHExecutor): void => {
  ipcMain.handle(
    BOOTSTRAP_CHECK_HOST_CHANNEL,
    async (event): Promise<IpcResult<BootstrapCheckHostResponse>> => {
      const senderFrameUrl = event.senderFrame?.url ?? "";
      if (!isTrustedSender(senderFrameUrl)) {
        return { ok: false, error: { message: "Untrusted sender", code: "UNTRUSTED_SENDER" } };
      }

      try {
        await executor.checkConnection({ timeoutMs: 7_000 });
        return {
          ok: true,
          data: { reachable: true, checkedAt: new Date().toISOString() },
        };
      } catch (error) {
        return { ok: false, error: toIpcError(error) };
      }
    }
  );

  ipcMain.handle(
    BOOTSTRAP_INSTALL_DAEMON_CHANNEL,
    async (event): Promise<IpcResult<BootstrapInstallDaemonResponse>> => {
      const senderFrameUrl = event.senderFrame?.url ?? "";
      if (!isTrustedSender(senderFrameUrl)) {
        return { ok: false, error: { message: "Untrusted sender", code: "UNTRUSTED_SENDER" } };
      }

      return {
        ok: false,
        error: {
          code: "DAEMON_INSTALL_NOT_IMPLEMENTED",
          message: "Daemon install pipeline is not implemented in 1.x",
        },
      };
    }
  );
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
