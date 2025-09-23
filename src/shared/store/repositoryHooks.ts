import { useRoutesStore } from "@/shared/store/slices/routesSlice";
import { createRouteRepositoryAdapter } from "@/shared/store/adapters/RouteRepositoryAdapter";
import type { RouteRepository } from "@/core/repositories/RouteRepository";

export function useRoutesRepository(): RouteRepository {
  const store = useRoutesStore();
  // Bind adapter to zustand store state and setter
  return createRouteRepositoryAdapter(
    () => ({ routes: store.routes }),
    (updater) => {
      const partial = updater({ routes: store.routes });
      if (partial.routes) {
        // write back into zustand store
        (store as any).setState({ routes: partial.routes });
      }
    }
  );
}
