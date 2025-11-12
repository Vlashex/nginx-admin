// store/adapters/RouteRepositoryAdapter.ts
import type { RouteRepository } from "@/core/repositories/RouteRepository";
import type { Route } from "@/core/entities/types";

interface State {
  routes: Map<string, Route>;
}

export const createRouteRepositoryAdapter = (
  get: () => State,
  set: (fn: (state: State) => Partial<State>) => void
): RouteRepository => ({
  findAll: async () => Array.from(get().routes.values()),
  findById: async (id) => get().routes.get(id) ?? null,
  save: async (route) => {
    set((state) => {
      const newRoutes = new Map(state.routes);

      newRoutes.set(route.id, route);

      return { routes: newRoutes };
    });
  },
  delete: async (id) => {
    set((state) => {
      const newRoutes = new Map(state.routes);
      newRoutes.delete(id);
      return { routes: newRoutes };
    });
  },
  saveAll: async (routes) => {
    set(() => ({ routes: new Map(routes) }));
  },
  loadAll: async () => get().routes,
});
