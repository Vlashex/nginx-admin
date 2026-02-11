import { contextBridge, ipcRenderer } from "electron";
import { REMOTE_EXECUTE_CHANNEL, } from "@vlashex/transport/ipc";
const bridge = {
    execute: (request) => ipcRenderer.invoke(REMOTE_EXECUTE_CHANNEL, request),
};
contextBridge.exposeInMainWorld("remoteBridge", bridge);
