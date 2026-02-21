import type { PreloadBootstrapBridge } from "../preload/remoteBridge";

declare global {
  interface Window {
    bootstrapBridge: PreloadBootstrapBridge;
  }
}

export {};
