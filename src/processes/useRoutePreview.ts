import { useMemo } from "react";
import { generateConfigPreview } from "@/core/services/ConfigGenerator";
import type { UseFormReturn } from "react-hook-form";
import { mapFormToRoute } from "@/shared/lib/formAdapters";

export function useRoutePreview<TValues extends object>(
  form: UseFormReturn<TValues>
) {
  return useMemo(() => {
    const values = form.getValues() as any;
    const route = mapFormToRoute(values);
    return generateConfigPreview(route);
  }, [form.watch()]);
}
