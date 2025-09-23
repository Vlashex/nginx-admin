import { useMemo } from "react";
import { generateConfigPreview } from "@/core/services/ConfigGenerator";
import type { UseFormReturn } from "react-hook-form";
import { mapFormToRoute } from "@/shared/lib/formAdapters";
import type { Route } from "@/core/entities/types";

export function useRoutePreview(form: UseFormReturn<Route>) {
  return useMemo(() => {
    const values = form.getValues();
    const route = mapFormToRoute(values);
    return generateConfigPreview(route);
  }, [form]);
}
