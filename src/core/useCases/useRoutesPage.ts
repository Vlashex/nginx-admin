import { useCallback, useState } from "react";
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
import { toast } from "sonner";

// 🕓 вспомогательная функция задержки
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function useRoutesPage() {
  const { list, isLoading, error } = useRoutesList();
  const ops = useRouteOperations();
  const ui = useRouteFormStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isRemovingLocation, setIsRemovingLocation] = useState(false);

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

  // 💾 Сохранение маршрута
  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await delay(3000);
      if (ui.mode === "create" || !values.id) {
        await ops.create(RouteSchema.parse(values));
        toast.success("Маршрут создан");
      } else {
        const { id, ...rest } = values;
        await ops.update(id, RouteSchema.parse(rest));
        toast.success("Изменения сохранены");
      }
      closeModal();
    } catch {
      toast.error("Ошибка при сохранении маршрута");
    } finally {
      setIsSaving(false);
    }
  });

  // 💾 Сохранение маршрута (force)
  const saveRouteForce = useCallback(async () => {
    setIsSaving(true);
    try {
      await delay(3000);
      const values = form.getValues();
      if (ui.mode === "create" || !values.id) {
        await ops.create(values as Route);
        toast.success("Маршрут создан");
      } else {
        const { id, ...rest } = values;
        await ops.update(id, rest as Route);
        toast.success("Изменения сохранены");
      }
      closeModal();
    } catch {
      toast.error("Ошибка при сохранении маршрута");
    } finally {
      setIsSaving(false);
    }
  }, [form, ui, ops, closeModal]);

  // 🗑️ Удаление маршрута
  const removeRoute = useCallback(
    async (id: string) => {
      setIsRemoving(true);
      try {
        await delay(3000);
        await ops.remove(id);
        toast.success("Маршрут удалён");
      } catch {
        toast.error("Ошибка при удалении маршрута");
      } finally {
        setIsRemoving(false);
      }
    },
    [ops]
  );

  // ⚙️ Работа с локациями
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

  // 🗑️ Удаление локации
  const deleteLocation = useCallback(
    async (index: number) => {
      setIsRemovingLocation(true);
      try {
        await delay(3000);
        const current = form.getValues("locations") as LocationConfig[];
        const next = removeLocation(current, index);
        form.setValue("locations", next);
        toast.success("Локация удалена");
      } catch {
        toast.error("Ошибка при удалении локации");
      } finally {
        setIsRemovingLocation(false);
      }
    },
    [form]
  );

  // 💾 Сохранение локации
  const saveLocation = useCallback(
    async (value: LocationConfig) => {
      setIsSavingLocation(true);
      try {
        await delay(3000);
        const errors = validateLocation(value);
        if (Object.keys(errors).length > 0) {
          toast.error("Некорректная конфигурация локации");
          return;
        }

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
        toast.success("Локация сохранена");
      } catch {
        toast.error("Ошибка при сохранении локации");
      } finally {
        setIsSavingLocation(false);
      }
    },
    [form, ui]
  );

  // 💾 Сохранение локации (force)
  const saveLocationForce = useCallback(
    async (value: LocationConfig) => {
      setIsSavingLocation(true);
      try {
        await delay(3000);
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
        toast.success("Локация сохранена");
      } catch {
        toast.error("Ошибка при сохранении локации");
      } finally {
        setIsSavingLocation(false);
      }
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

    // 🔄 состояния
    isSaving,
    isRemoving,
    isSavingLocation,
    isRemovingLocation,

    // функции
    openForCreate,
    openForEdit,
    closeModal,
    onSubmit,
    saveRouteForce,
    removeRoute,
    addLocation,
    editLocation,
    deleteLocation,
    saveLocation,
    saveLocationForce,
  };
}
