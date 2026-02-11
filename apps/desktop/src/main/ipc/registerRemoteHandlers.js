import { ipcMain } from "electron";
import { REMOTE_EXECUTE_CHANNEL, } from "@vlashex/transport/ipc";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
const ALLOWED_COMMANDS = new Set(["routes:list", "routes:save", "routes:toggle"]);
const toIpcError = (error) => {
    if (error instanceof RemoteExecutionError) {
        return { message: error.message, code: error.code };
    }
    if (error instanceof Error) {
        return { message: error.message, code: "REMOTE_EXECUTION_FAILED" };
    }
    return { message: "Unhandled remote error", code: "REMOTE_EXECUTION_FAILED" };
};
const executeTyped = async (executor, request) => {
    try {
        const data = await executor.execute(request.command, request.payload, request.options);
        return { ok: true, data };
    }
    catch (error) {
        return { ok: false, error: toIpcError(error) };
    }
};
export const registerRemoteHandlers = (executor) => {
    ipcMain.handle(REMOTE_EXECUTE_CHANNEL, async (_event, request) => {
        if (!ALLOWED_COMMANDS.has(request.command)) {
            return { ok: false, error: { message: "Command not allowed", code: "COMMAND_NOT_ALLOWED" } };
        }
        return executeTyped(executor, request);
    });
};
