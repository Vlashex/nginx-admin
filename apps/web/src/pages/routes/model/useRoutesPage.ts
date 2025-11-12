import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import {
  validateLocation,
  createLocation,
  addLocationToRoute,
  updateLocationInRoute,
  removeLocation,
} from "@vlashex/core/useCases/routeForm";
import { useRouteOperations } from "@/processes/useRouteOperations";
import { useRouteFormStore } from "@vlashex/shared/src/store/useRouteFormStore";
import { useRoutePreview } from "@/processes/useRoutePreview";
import { useRoutesList } from "@/processes/useRoutesList";
import { createRoute, urlPath } from "@vlashex/shared/src/lib/factories";
import {
  RouteSchema,
  type LocationConfig,
  type Route,
  type RouteInput,
  type URLPath,
} from "@vlashex/core/entities/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function useRoutesPage() {
  const { list, isLoading, error } = useRoutesList();
  const routeOps = useRouteOperations();
  const uiStore = useRouteFormStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isRemovingLocation, setIsRemovingLocation] = useState(false);

  const form = useForm<RouteInput>({
    resolver: zodResolver(RouteSchema),
    defaultValues: createRoute() as RouteInput,
  });

  const preview = useRoutePreview(form);

  /** =======================
   *  ROUTE ACTIONS
   *  ======================= */

  const openForCreate = useCallback(() => {
    uiStore.openForCreate();
    form.reset(createRoute());
  }, [form, uiStore]);

  const openForEdit = useCallback(
    (route: Route) => {
      uiStore.openForEdit();
      form.reset(route);
    },
    [form, uiStore]
  );

  const closeModal = useCallback(() => {
    uiStore.closeModal();
    routeOps.reset();
  }, [routeOps, uiStore]);

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      await delay(3000);
      if (uiStore.mode === "create" || !values.id) {
        await routeOps.create(RouteSchema.parse(values));
        toast.success("Маршрут создан");
      } else {
        const { id, ...rest } = values;
        await routeOps.update(id, RouteSchema.parse(rest));
        toast.success("Изменения сохранены");
      }
      closeModal();
    } catch {
      toast.error("Ошибка при сохранении маршрута");
    } finally {
      setIsSaving(false);
    }
  });

  const saveRouteForce = useCallback(async () => {
    setIsSaving(true);
    try {
      await delay(3000);
      const values = form.getValues();
      if (uiStore.mode === "create" || !values.id) {
        await routeOps.create(values as Route);
        toast.success("Маршрут создан");
      } else {
        const { id, ...rest } = values;
        await routeOps.update(id, rest as Route);
        toast.success("Изменения сохранены");
      }
      closeModal();
    } catch {
      toast.error("Ошибка при сохранении маршрута");
    } finally {
      setIsSaving(false);
    }
  }, [form, uiStore, routeOps, closeModal]);

  const onToggle = useCallback(
    async (id: string) => {
      try {
        await routeOps.toggle(id);
        toast.success("Статус маршрута изменён");
      } catch {
        toast.error("Ошибка при изменении статуса");
      }
    },
    [routeOps]
  );

  const onRemove = useCallback(
    async (id: string) => {
      setIsRemoving(true);
      try {
        await delay(3000);
        await routeOps.remove(id);
        toast.success("Маршрут удалён");
      } catch {
        toast.error("Ошибка при удалении маршрута");
      } finally {
        setIsRemoving(false);
      }
    },
    [routeOps]
  );

  /** =======================
   *  LOCATION ACTIONS
   *  ======================= */

  const onAddLocation = useCallback(() => {
    const loc = createLocation({ path: "/" as URLPath });
    const uiLoc: LocationConfig = {
      path: urlPath(loc.path || "/"),
      proxy_pass: undefined,
      try_files: loc.try_files || "",
      index: loc.index || "",
      extra_directives: loc.extra_directives || "",
    };
    uiStore.startEditLocation(null, uiLoc);
  }, [uiStore]);

  const onEditLocation = useCallback(
    (index: number, value: LocationConfig) => {
      uiStore.startEditLocation(index, value);
    },
    [uiStore]
  );

  const startEditLocation = useCallback(
    (index: number | null, value: LocationConfig | null) => {
      uiStore.startEditLocation(index, value);
    },
    [uiStore]
  );

  const onDeleteLocation = useCallback(
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

  const onSaveLocation = useCallback(
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
          uiStore.locationEditing.index === null
            ? (addLocationToRoute(current, value) as LocationConfig[])
            : (updateLocationInRoute(
                current,
                uiStore.locationEditing.index!,
                value
              ) as LocationConfig[]);

        form.setValue("locations", next);
        uiStore.startEditLocation(null, null);
        toast.success("Локация сохранена");
      } catch {
        toast.error("Ошибка при сохранении локации");
      } finally {
        setIsSavingLocation(false);
      }
    },
    [form, uiStore]
  );

  const onSaveLocationForce = useCallback(
    async (value: LocationConfig) => {
      setIsSavingLocation(true);
      try {
        await delay(3000);
        const current = form.getValues("locations") as LocationConfig[];
        const next =
          uiStore.locationEditing.index === null
            ? (addLocationToRoute(current, value) as LocationConfig[])
            : (updateLocationInRoute(
                current,
                uiStore.locationEditing.index!,
                value
              ) as LocationConfig[]);

        form.setValue("locations", next);
        uiStore.startEditLocation(null, null);
        toast.success("Локация сохранена");
      } catch {
        toast.error("Ошибка при сохранении локации");
      } finally {
        setIsSavingLocation(false);
      }
    },
    [form, uiStore]
  );

  /** =======================
   *  Публичный интерфейс страницы
   *  ======================= */
  return {
    list,
    isLoading,
    error,
    form,
    preview,
    isSaving,
    isRemoving,
    isSavingLocation,
    isRemovingLocation,

    // handlers
    onCreate: openForCreate,
    onEdit: openForEdit,
    onToggle,
    onRemove,
    onSubmit,
    onSaveForce: saveRouteForce,
    onClose: closeModal,

    // location
    location: {
      editing: uiStore.locationEditing,
      onAdd: onAddLocation,
      onEdit: onEditLocation,
      onStartEdit: startEditLocation,
      onDelete: onDeleteLocation,
      onSave: onSaveLocation,
      onSaveForce: onSaveLocationForce,
    },

    // modal state
    modal: {
      isOpen: uiStore.modalOpen,
      mode: uiStore.mode,
      activeTab: uiStore.activeTab,
      setActiveTab: uiStore.setActiveTab,
    },
  };
}
