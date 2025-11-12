import { useRoutesStore } from "@/shared/store/slices/routesSlice";
import { createRouteRepositoryAdapter } from "@/shared/store/adapters/RouteRepositoryAdapter";
import type { RouteRepository } from "@/core/repositories/RouteRepository";

export function useRoutesRepository(): RouteRepository {
  const routes = useRoutesStore((s) => s.routes); // берём данные
  const api = useRoutesStore; // сам стор с setState/getState

  return createRouteRepositoryAdapter(
    () => ({ routes }),
    async (updater) => {
      const partial = updater({ routes });
      if (partial.routes) {
        api.setState({ routes: partial.routes }); // ✅ работает
        await api.getState().saveRoutes(); // ✅ вызвать экшен
      }
    }
  );
}
