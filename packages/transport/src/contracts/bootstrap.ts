export const BOOTSTRAP_CHECK_HOST_CHANNEL = "bootstrap:check-host";
export const BOOTSTRAP_INSTALL_DAEMON_CHANNEL = "bootstrap:install-daemon";

export interface BootstrapCheckHostResponse {
  reachable: boolean;
  checkedAt: string;
}

export interface BootstrapInstallDaemonResponse {
  status: "NOT_IMPLEMENTED";
  message: string;
}
