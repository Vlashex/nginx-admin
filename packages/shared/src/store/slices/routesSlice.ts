// store/slices/routesSlice.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  createRoute,
  updateRoute,
  toggleRouteStatus,
  LocalStorageRouteRepository,
} from "@vlashex/core";
import {
  redactPotentialSecrets,
  sanitizeForJson,
} from "@vlashex/core/security/secrets";
import type { RouteRepository } from "@vlashex/core";
import type { Route } from "@vlashex/core";

interface RoutesState {
  routes: Map<string, Route>;
  currentRouteId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface RoutesActions {
  addRoute: (routeData: Omit<Route, "id" | "metadata">) => Promise<string>;
  updateRoute: (
    id: string,
    updates: Partial<Omit<Route, "id">>
  ) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  toggleRouteStatus: (id: string) => Promise<void>;
  setCurrentRoute: (id: string | null) => void;
  loadRoutes: () => Promise<void>;
  saveRoutes: () => Promise<boolean>;
}

type RoutesStore = RoutesState & RoutesActions;

export const createRoutesStore = (repository: RouteRepository) => {
  const sanitizeRoutesMap = (routes: Map<string, Route>): Map<string, Route> =>
    new Map(
      Array.from(routes.entries()).map(([id, route]) => [
        id,
        sanitizeForJson(route) as Route,
      ])
    );

  return create<RoutesStore>()(
    devtools(
      (set, get) => ({
        routes: new Map(),
        currentRouteId: null,
        isLoading: false,
        error: null,

        addRoute: async (routeData) => {
          try {
            return await createRoute(repository, routeData);
          } catch (error) {
            set({ error: redactPotentialSecrets((error as Error).message) });
            throw error;
          }
        },

        updateRoute: async (id, updates) => {
          try {
            await updateRoute(repository, id, updates);
          } catch (error) {
            set({ error: redactPotentialSecrets((error as Error).message) });
            throw error;
          }
        },

        deleteRoute: async (id) => {
          try {
            await repository.delete(id);
            set((state) => ({
              currentRouteId:
                state.currentRouteId === id ? null : state.currentRouteId,
            }));
          } catch (error) {
            set({ error: redactPotentialSecrets((error as Error).message) });
            throw error;
          }
        },

        toggleRouteStatus: async (id) => {
          try {
            await toggleRouteStatus(repository, id);
          } catch (error) {
            set({ error: redactPotentialSecrets((error as Error).message) });
            throw error;
          }
        },

        setCurrentRoute: (id) => set({ currentRouteId: id }),

        loadRoutes: async () => {
          set({ isLoading: true, error: null });
          try {
            const routes = await repository.loadAll();
            set({ routes: sanitizeRoutesMap(routes), isLoading: false });
          } catch (error) {
            set({
              error: redactPotentialSecrets((error as Error).message),
              isLoading: false,
            });
          }
        },

        saveRoutes: async () => {
          try {
            await repository.saveAll(get().routes);
            return true;
          } catch (error) {
            set({ error: redactPotentialSecrets((error as Error).message) });
            return false;
          }
        },
      }),
      { name: "RoutesStore" }
    )
  );
};

// Создаем экземпляр по умолчанию для использования в приложении
const createDefaultRouteRepository = (): RouteRepository => {
  // TODO(daemon-2.x): inject daemon-backed repository from composition root.
  return new LocalStorageRouteRepository();
};

export const useRoutesStore = createRoutesStore(createDefaultRouteRepository());
