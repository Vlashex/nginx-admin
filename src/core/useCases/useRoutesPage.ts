import { useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  validateLocation,
  createLocation,
  addLocationToRoute,
  updateLocationInRoute,
  removeLocation,
} from "@/core/useCases/routeForm";
import { useRouteOperations } from "@/processes/useRouteOperations";
import { useRouteFormStore } from "@/shared/store/useRouteFormStore";
import { useRoutePreview } from "@/processes/useRoutePreview";
import { useRoutesList } from "@/processes/useRoutesList";
import { createRoute, urlPath } from "@/shared/lib/factories";
import {
  RouteSchema,
  type LocationConfig,
  type Route,
  type RouteInput,
  type URLPath,
} from "@/core/entities/types";
import { zodResolver } from "@hookform/resolvers/zod";

export function useRoutesPage() {
  const { list, isLoading, error } = useRoutesList();
  const ops = useRouteOperations();
  const ui = useRouteFormStore();

  const form = useForm<RouteInput>({
    resolver: zodResolver(RouteSchema),
    defaultValues: createRoute() as RouteInput,
  });

  const preview = useRoutePreview(form);

  const openForCreate = useCallback(() => {
    ui.openForCreate();
    form.reset(createRoute());
  }, [form, ui]);

  const openForEdit = useCallback(
    (route: Route) => {
      ui.openForEdit();
      form.reset(route);
    },
    [form, ui]
  );

  const closeModal = useCallback(() => {
    ui.closeModal();
    ops.reset();
  }, [ops, ui]);

  const onSubmit = form.handleSubmit(async (values) => {
    console.log(values);
    try {
      if (ui.mode === "create" || !values.id) {
        await ops.create(RouteSchema.parse(values));
      } else {
        const { id, ...rest } = values;
        await ops.update(id, RouteSchema.parse(rest));
      }
      closeModal();
    } catch {
      // ошибки уже есть в ops.error
    }
  });

  const saveRouteForce = useCallback(async () => {
    try {
      const values = form.getValues();
      if (ui.mode === "create" || !values.id) {
        await ops.create(values as Route); // ❗ без валидации
      } else {
        const { id, ...rest } = values;
        await ops.update(id, rest as Route);
      }
      closeModal();
    } catch (err) {
      console.error("Ошибка при saveRouteForce:", err);
    }
  }, [form, ui, ops, closeModal]);

  const addLocation = useCallback(() => {
    const loc = createLocation({ path: "/" as URLPath });
    const uiLoc: LocationConfig = {
      path: urlPath(loc.path || "/ad"),
      proxy_pass: undefined,
      try_files: loc.try_files || "",
      index: loc.index || "",
      extra_directives: loc.extra_directives || "",
    };
    ui.startEditLocation(null, uiLoc);
  }, [ui]);

  const editLocation = useCallback(
    (index: number, value: LocationConfig) => {
      ui.startEditLocation(index, value);
    },
    [ui]
  );

  const deleteLocation = useCallback(
    (index: number) => {
      const current = form.getValues("locations") as LocationConfig[];
      const next = removeLocation(current, index);
      form.setValue("locations", next);
    },
    [form]
  );

  const saveLocation = useCallback(
    (value: LocationConfig) => {
      const errors = validateLocation(value);
      if (Object.keys(errors).length > 0) return;

      const current = form.getValues("locations") as LocationConfig[];
      const next =
        ui.locationEditing.index === null
          ? (addLocationToRoute(current, value) as LocationConfig[])
          : (updateLocationInRoute(
              current,
              ui.locationEditing.index!,
              value
            ) as LocationConfig[]);

      form.setValue("locations", next);
      ui.startEditLocation(null, null);
    },
    [form, ui]
  );

  const saveLocationForce = useCallback(
    (value: LocationConfig) => {
      const current = form.getValues("locations") as LocationConfig[];
      const next =
        ui.locationEditing.index === null
          ? (addLocationToRoute(current, value) as LocationConfig[])
          : (updateLocationInRoute(
              current,
              ui.locationEditing.index!,
              value
            ) as LocationConfig[]);

      form.setValue("locations", next);
      ui.startEditLocation(null, null);
    },
    [form, ui]
  );

  return {
    list,
    isLoading,
    error,
    ops,
    ui,
    form,
    preview,
    openForCreate,
    openForEdit,
    closeModal,
    onSubmit,
    saveRouteForce,
    addLocation,
    editLocation,
    deleteLocation,
    saveLocation,
    saveLocationForce,
  };
}
