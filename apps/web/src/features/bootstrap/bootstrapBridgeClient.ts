import type {
  BootstrapCheckHostResponse,
  BootstrapContextResponse,
  BootstrapInstallDaemonResponse,
  BootstrapInstallOptions,
} from "@vlashex/transport/contracts/bootstrap";

interface BridgeSuccess<TData> {
  ok: true;
  data: TData;
}

interface BridgeFailure {
  ok: false;
  error: { message: string; code: string };
}

type BridgeResult<TData> = BridgeSuccess<TData> | BridgeFailure;

interface DesktopBootstrapBridge {
  getContext: () => Promise<BridgeResult<BootstrapContextResponse>>;
  checkHost: () => Promise<BridgeResult<BootstrapCheckHostResponse>>;
  installDaemon: (request: {
    options: BootstrapInstallOptions;
  }) => Promise<BridgeResult<BootstrapInstallDaemonResponse>>;
}

const unavailable = <TData>(message: string): BridgeResult<TData> => ({
  ok: false,
  error: {
    code: "BOOTSTRAP_UNAVAILABLE",
    message,
  },
});

const resolveBridge = (): DesktopBootstrapBridge | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const bridge = (window as Window & { bootstrapBridge?: DesktopBootstrapBridge }).bootstrapBridge;
  if (!bridge) {
    return null;
  }

  return bridge;
};

export const getBootstrapContext = async (): Promise<BridgeResult<BootstrapContextResponse>> => {
  const bridge = resolveBridge();
  if (!bridge) {
    return unavailable("Bootstrap bridge is available only in desktop runtime");
  }
  return bridge.getContext();
};

export const checkBootstrapHost = async (): Promise<BridgeResult<BootstrapCheckHostResponse>> => {
  const bridge = resolveBridge();
  if (!bridge) {
    return unavailable("Bootstrap bridge is available only in desktop runtime");
  }
  return bridge.checkHost();
};

export const installBootstrapDaemon = async (options: BootstrapInstallOptions): Promise<BridgeResult<BootstrapInstallDaemonResponse>> => {
  const bridge = resolveBridge();
  if (!bridge) {
    return unavailable("Bootstrap bridge is available only in desktop runtime");
  }
  return bridge.installDaemon({ options });
};
