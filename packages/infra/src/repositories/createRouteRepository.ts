import type { RouteRepository } from "@vlashex/core";
import { BrowserLocalStorageRouteRepository } from "./BrowserLocalStorageRouteRepository";
import { RemoteBridgeRouteRepository } from "./RemoteBridgeRouteRepository";

export interface RouteRepositoryFactoryOptions {
  fallbackStorageKey?: string;
}

export const createRouteRepository = (
  options: RouteRepositoryFactoryOptions = {}
): RouteRepository => {
  // TODO(daemon-2.x): replace transitional bridge resolution with daemon API repository wiring.
  if (RemoteBridgeRouteRepository.isAvailable()) {
    return RemoteBridgeRouteRepository.create();
  }

  return new BrowserLocalStorageRouteRepository(options.fallbackStorageKey);
};
