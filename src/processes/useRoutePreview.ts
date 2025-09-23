import { useMemo } from "react";
import { generateConfigPreview } from "@/core/services/ConfigGenerator";
import type { UseFormReturn } from "react-hook-form";
import {
  mapFormToRoute,
  type RouteFormValues,
} from "@/shared/lib/formAdapters";

export function useRoutePreview(form: UseFormReturn<RouteFormValues>) {
  return useMemo(() => {
    const values = form.getValues();
    const route = mapFormToRoute(values);
    return generateConfigPreview(route);
  }, [form]);
}
