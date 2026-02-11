import { create } from "zustand";
export const useRoutesStore = create((set) => ({
    pending: false,
    error: null,
    routes: [],
    setPending: (pending) => set({ pending }),
    setError: (error) => set({ error }),
    replaceRoutes: (routes) => set({ routes }),
    upsertRoute: (route) => set((state) => ({
        routes: state.routes.some((r) => r.id === route.id)
            ? state.routes.map((r) => (r.id === route.id ? route : r))
            : [...state.routes, route],
    })),
}));
