import { useRoutesStore } from "@/shared/store/slices";
import { useEffect, useMemo } from "react";

export function useRoutesList() {
  const { routes, isLoading, error, loadRoutes } = useRoutesStore();
  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);
  const list = useMemo(() => Array.from(routes.values()), [routes]);
  return { list, isLoading, error };
}
