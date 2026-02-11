import { contextBridge, ipcRenderer } from "electron";
import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import {
  REMOTE_EXECUTE_CHANNEL,
  type RemoteIpcRequest,
  type RemoteIpcResult,
} from "@vlashex/transport/ipc";

export interface PreloadRemoteBridge {
  execute<TKey extends keyof RouteCommandMap & string>(
    request: RemoteIpcRequest<RouteCommandMap, TKey>
  ): Promise<RemoteIpcResult<RouteCommandMap[TKey]["res"]>>;
}

const bridge: PreloadRemoteBridge = {
  execute: (request) => ipcRenderer.invoke(REMOTE_EXECUTE_CHANNEL, request),
};

contextBridge.exposeInMainWorld("remoteBridge", bridge);
