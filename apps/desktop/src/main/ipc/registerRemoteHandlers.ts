import { app, ipcMain } from "electron";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import {
  REMOTE_EXECUTE_CHANNEL,
  type RemoteIpcRequest,
  type RemoteIpcResult,
} from "@vlashex/transport/ipc";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
import { SSHExecutor } from "../ssh/SSHExecutor.js";

type RouteCommand = keyof RouteCommandMap & string;
type RouteResponseUnion = RouteCommandMap[RouteCommand]["res"];
const ALLOWED_COMMANDS = new Set<RouteCommand>(["routes:list", "routes:save", "routes:toggle"]);

const toIpcError = (error: unknown): { message: string; code: string } => {
  if (error instanceof RemoteExecutionError) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    return { message: error.message, code: "REMOTE_EXECUTION_FAILED" };
  }
  return { message: "Unhandled remote error", code: "REMOTE_EXECUTION_FAILED" };
};

const executeTyped = async <TCommand extends RouteCommand>(
  executor: SSHExecutor,
  request: RemoteIpcRequest<RouteCommandMap, TCommand>
): Promise<RemoteIpcResult<RouteCommandMap[TCommand]["res"]>> => {
  try {
    const data = await executor.execute(request.command, request.payload, request.options);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};

export const registerRemoteHandlers = (executor: SSHExecutor): void => {
  ipcMain.handle(
    REMOTE_EXECUTE_CHANNEL,
    async (
      event,
      request: RemoteIpcRequest<RouteCommandMap, RouteCommand>
    ): Promise<RemoteIpcResult<RouteResponseUnion>> => {
      const senderFrameUrl = event.senderFrame?.url ?? "";
      if (!isTrustedSender(senderFrameUrl)) {
        return { ok: false, error: { message: "Untrusted sender", code: "UNTRUSTED_SENDER" } };
      }

      if (!ALLOWED_COMMANDS.has(request.command)) {
        return { ok: false, error: { message: "Command not allowed", code: "COMMAND_NOT_ALLOWED" } };
      }

      return executeTyped(executor, request);
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
