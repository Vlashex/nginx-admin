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
export declare const useRoutesStore: import("zustand").UseBoundStore<import("zustand").StoreApi<RoutesState>>;
export {};
//# sourceMappingURL=routesStore.d.ts.map