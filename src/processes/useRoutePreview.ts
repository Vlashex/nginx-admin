import { useMemo } from "react";
import { generateConfigPreview } from "@/core/services/ConfigGenerator";
import type { UseFormReturn } from "react-hook-form";
import { RouteSchema, type RouteInput } from "@/core/entities/types";

export function useRoutePreview(form: UseFormReturn<RouteInput>) {
  return useMemo(() => {
    const values = form.getValues();
    const route = RouteSchema.parse(values);
    return generateConfigPreview(route);
  }, [form]);
}
