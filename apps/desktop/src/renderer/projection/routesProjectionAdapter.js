import { useRoutesStore } from "../store/routesStore";
export const createRoutesProjectionAdapter = () => ({
    setPending: (pending) => useRoutesStore.getState().setPending(pending),
    setError: (message) => useRoutesStore.getState().setError(message),
    replaceRoutes: (routes) => useRoutesStore.getState().replaceRoutes(routes),
    upsertRoute: (route) => useRoutesStore.getState().upsertRoute(route),
});
