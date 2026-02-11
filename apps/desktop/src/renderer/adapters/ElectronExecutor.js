import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";
export class ElectronExecutor {
    async execute(command, payload) {
        const result = await window.remoteBridge.execute({ command, payload });
        if (!result.ok) {
            throw new RemoteExecutionError(result.error.message, result.error.code, result.error.details);
        }
        return result.data;
    }
}
