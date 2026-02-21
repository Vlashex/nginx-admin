import { contextBridge, ipcRenderer } from "electron";
import type {
  BootstrapContextResponse,
  BootstrapInstallOptions,
  BootstrapCheckHostResponse,
  BootstrapInstallDaemonResponse,
} from "@vlashex/transport/contracts/bootstrap";

const BOOTSTRAP_CHECK_HOST_CHANNEL = "bootstrap:check-host";
const BOOTSTRAP_GET_CONTEXT_CHANNEL = "bootstrap:get-context";
const BOOTSTRAP_INSTALL_DAEMON_CHANNEL = "bootstrap:install-daemon";

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
  getContext: () => Promise<BridgeResult<BootstrapContextResponse>>;
  checkHost: () => Promise<BridgeResult<BootstrapCheckHostResponse>>;
  installDaemon: (request: {
    options: BootstrapInstallOptions;
  }) => Promise<BridgeResult<BootstrapInstallDaemonResponse>>;
}

const bootstrapBridge: PreloadBootstrapBridge = {
  getContext: () => ipcRenderer.invoke(BOOTSTRAP_GET_CONTEXT_CHANNEL),
  checkHost: () => ipcRenderer.invoke(BOOTSTRAP_CHECK_HOST_CHANNEL),
  installDaemon: (request) => ipcRenderer.invoke(BOOTSTRAP_INSTALL_DAEMON_CHANNEL, request),
};

contextBridge.exposeInMainWorld("bootstrapBridge", bootstrapBridge);
