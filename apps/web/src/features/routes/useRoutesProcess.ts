import { useEffect, useMemo } from "react";
import type { RouteDraft, RouteId } from "@vlashex/core/domain/Route";
import { composeRoutesProcess } from "../../composition/composeRoutesProcess";

export const useRoutesProcess = () => {
  const process = useMemo(
    () =>
      composeRoutesProcess({
        transport: import.meta.env.VITE_USE_MOCK === "true" ? "mock" : "http",
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      }),
    []
  );

  useEffect(() => {
    void process.load(true);
  }, [process]);

  const load = () => process.load(true);
  const save = (draft: RouteDraft) => process.save(draft);
  const toggle = (id: RouteId, enabled: boolean) => process.toggle(id, enabled);

  return { load, save, toggle };
};
