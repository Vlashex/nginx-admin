import { useMemo } from "react";
import { generateConfigPreview } from "@/core/services/ConfigGenerator";
import type { UseFormReturn } from "react-hook-form";
import { RouteSchema, type RouteInput } from "@/core/entities/types";

import { useWatch } from "react-hook-form";

export function useRoutePreview(form: UseFormReturn<RouteInput>) {
  const values = useWatch({ control: form.control });
  return useMemo(() => {
    try {
      const route = RouteSchema.parse(values);
      return generateConfigPreview(route);
    } catch {
      return "# Ошибка конфигурации";
    }
  }, [values]);
}
