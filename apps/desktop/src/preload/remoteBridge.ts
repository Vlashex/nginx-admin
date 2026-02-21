import { contextBridge, ipcRenderer } from "electron";
import {
  BOOTSTRAP_CHECK_HOST_CHANNEL,
  BOOTSTRAP_INSTALL_DAEMON_CHANNEL,
  type BootstrapCheckHostResponse,
  type BootstrapInstallDaemonResponse,
} from "@vlashex/transport/contracts/bootstrap";

interface BridgeSuccess<TData> {
  ok: true;
  data: TData;
}

interface BridgeFailure {
  ok: false;
  error: { message: string; code: string };
}

export type BridgeResult<TData> = BridgeSuccess<TData> | BridgeFailure;

export interface PreloadBootstrapBridge {
  checkHost: () => Promise<BridgeResult<BootstrapCheckHostResponse>>;
  installDaemon: () => Promise<BridgeResult<BootstrapInstallDaemonResponse>>;
}

const bootstrapBridge: PreloadBootstrapBridge = {
  checkHost: () => ipcRenderer.invoke(BOOTSTRAP_CHECK_HOST_CHANNEL),
  installDaemon: () => ipcRenderer.invoke(BOOTSTRAP_INSTALL_DAEMON_CHANNEL),
};

contextBridge.exposeInMainWorld("bootstrapBridge", bootstrapBridge);
