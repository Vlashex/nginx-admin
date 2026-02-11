import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("remoteBridge", {
  execute: (request: unknown) =>
    ipcRenderer.invoke("remote:execute", request),
});
