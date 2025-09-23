import { useState, useCallback } from "react";
import type { RouteRepository } from "@/core/repositories/RouteRepository";
import {
  createRoute,
  updateRoute,
  toggleRouteStatus,
} from "@/core/useCases/routes";

export function useRouteOperations(repository: RouteRepository) {
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
    async (data: any) => wrap(() => createRoute(repository, data), "Сохранено"),
    [repository, wrap]
  );

  const update = useCallback(
    async (id: string, updates: any) =>
      wrap(() => updateRoute(repository, id, updates), "Обновлено"),
    [repository, wrap]
  );

  const toggle = useCallback(
    async (id: string) =>
      wrap(() => toggleRouteStatus(repository, id), "Готово"),
    [repository, wrap]
  );

  return {
    loading,
    error,
    success,
    create,
    update,
    toggle,
    setSuccess,
    setError,
  };
}
