import { useState, useCallback } from "react";
import { useRoutesRepository } from "@/shared/store/repositoryHooks";
import { useRoutesStore } from "@/shared/store/slices";
import {
  createRoute,
  updateRoute,
  toggleRouteStatus,
} from "@/core/useCases/routes";
import type { Route } from "@/core/entities/types";

export function useRouteOperations() {
  const repository = useRoutesRepository();
  const loadRoutes = useRoutesStore((s) => s.loadRoutes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const wrap = useCallback(
    async <T>(
      fn: () => Promise<T>,
      successMessage: string
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const res = await fn();
        setSuccess(successMessage);
        return res;
      } catch (e) {
        setError((e as Error).message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const create = useCallback(
    async (data: Route) =>
      wrap(async () => {
        await createRoute(repository, data);
        await loadRoutes();
      }, "Сохранено"),
    [repository, loadRoutes, wrap]
  );

  const update = useCallback(
    async (id: string, updates: Partial<Route>) =>
      wrap(async () => {
        await updateRoute(repository, id, updates);
        await loadRoutes();
      }, "Обновлено"),
    [repository, loadRoutes, wrap]
  );

  const toggle = useCallback(
    async (id: string) =>
      wrap(async () => {
        await toggleRouteStatus(repository, id);
        await loadRoutes();
      }, "Готово"),
    [repository, loadRoutes, wrap]
  );

  const remove = useCallback(
    async (id: string) =>
      wrap(async () => {
        await repository.delete(id);
        await loadRoutes();
      }, "Удалено"),
    [repository, loadRoutes, wrap]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    create,
    update,
    toggle,
    remove,
    reset,
  };
}
