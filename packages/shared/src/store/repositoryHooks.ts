import { useRoutesStore } from "../store/slices/routesSlice";
import { createRouteRepositoryAdapter } from "../store/adapters/RouteRepositoryAdapter";
import type { RouteRepository } from "@vlashex/core";

export function useRoutesRepository(): RouteRepository {
  const routes = useRoutesStore((s) => s.routes); // берём данные
  const api = useRoutesStore; // сам стор с setState/getState

  return createRouteRepositoryAdapter(
    () => ({ routes }),
    async (updater) => {
      const partial = updater({ routes });

      if (partial.routes) {
        api.setState({ routes: new Map(partial.routes) });
        await api.getState().saveRoutes();
      }
    }
  );
}
