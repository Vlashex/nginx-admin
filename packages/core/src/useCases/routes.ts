// core/useCases/routes.ts
import type { Route } from "../entities/types";
import type { RouteRepository } from "../repositories/RouteRepository";
import {
  validateDomain,
  validatePort,
  validateUnixPath,
} from "../utils/validators";

export const createRoute = async (
  repository: RouteRepository,
  routeData: Omit<Route, "id" | "metadata">
): Promise<string> => {
  if (!validateDomain(routeData.domain)) {
    throw new Error("Invalid domain format");
  }

  if (!validatePort(routeData.port)) {
    throw new Error("Port must be between 1 and 65535");
  }

  if (!validateUnixPath(routeData.root)) {
    throw new Error("Invalid path format");
  }

  const id = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const route: Route = {
    ...routeData,
    id,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
      tags: [],
    },
  };

  await repository.save(route);
  return id;
};

export const updateRoute = async (
  repository: RouteRepository,
  id: string,
  updates: Partial<Omit<Route, "id">>
): Promise<void> => {
  const existing = await repository.findById(id);
  if (!existing) {
    throw new Error("Route not found");
  }

  const updatedRoute: Route = {
    ...existing,
    ...updates,
    metadata: existing.metadata
      ? {
          ...existing.metadata,
          updatedAt: new Date(),
        }
      : undefined,
  };

  await repository.save(updatedRoute);
};

export const toggleRouteStatus = async (
  repository: RouteRepository,
  id: string
): Promise<void> => {
  const route = await repository.findById(id);
  if (!route) {
    throw new Error("Route not found");
  }

  await updateRoute(repository, id, {
    enabled: !route.enabled,
  });
};
