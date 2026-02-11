import type { PreloadRemoteBridge } from "../preload/remoteBridge";

declare global {
  interface Window {
    remoteBridge: PreloadRemoteBridge;
  }
}

export {};
