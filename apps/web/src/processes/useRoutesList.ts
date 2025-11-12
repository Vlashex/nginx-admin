import { useRoutesStore } from "@vlashex/shared/src/store/slices";
import { useEffect, useMemo } from "react";

export function useRoutesList() {
  const routes = useRoutesStore((s) => s.routes);
  const isLoading = useRoutesStore((s) => s.isLoading);
  const error = useRoutesStore((s) => s.error);
  const loadRoutes = useRoutesStore((s) => s.loadRoutes);
  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);
  const list = useMemo(() => Array.from(routes.values()), [routes]);
  return { list, isLoading, error };
}
