export const BOOTSTRAP_CHECK_HOST_CHANNEL = "bootstrap:check-host";
export const BOOTSTRAP_INSTALL_DAEMON_CHANNEL = "bootstrap:install-daemon";
export const BOOTSTRAP_GET_CONTEXT_CHANNEL = "bootstrap:get-context";

export interface BootstrapConnectionContext {
  id: string;
  name: string;
  host: string;
  port: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  checkedAt?: string;
  latencyMs?: number;
  status?: "unknown" | "reachable" | "unreachable";
}

export interface BootstrapInstallOptions {
  installScriptUrl: string;
  serviceName: string;
  healthCommand: string;
  timeoutMs?: number;
}

export interface BootstrapContextResponse {
  connection: BootstrapConnectionContext;
  defaults: BootstrapInstallOptions;
}

export interface BootstrapCheckHostResponse {
  reachable: boolean;
  checkedAt: string;
  latencyMs: number;
}

export interface BootstrapInstallDaemonResponse {
  installedAt: string;
  service: {
    name: string;
    active: boolean;
    enabled: boolean;
    activeStateRaw: string;
    enabledStateRaw: string;
  };
  health: {
    ok: boolean;
    output: string;
  };
}
