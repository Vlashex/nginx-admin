import { create } from "zustand";
import type { Route } from "@vlashex/core/domain/Route";

interface RoutesState {
  pending: boolean;
  error: string | null;
  routes: Route[];
  setPending: (pending: boolean) => void;
  setError: (error: string | null) => void;
  replaceRoutes: (routes: Route[]) => void;
  upsertRoute: (route: Route) => void;
}

export const useRoutesStore = create<RoutesState>((set) => ({
  pending: false,
  error: null,
  routes: [],
  setPending: (pending) => set({ pending }),
  setError: (error) => set({ error }),
  replaceRoutes: (routes) => set({ routes }),
  upsertRoute: (route) =>
    set((state) => ({
      routes: state.routes.some((r) => r.id === route.id)
        ? state.routes.map((r) => (r.id === route.id ? route : r))
        : [...state.routes, route],
    })),
}));
