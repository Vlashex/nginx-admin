// store/slices/routeFormSlice.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  validateForm,
  //   validateLocation,
  createLocation,
} from "@/shared/lib/core/useCases/routeForm";
import type {
  Route,
  LocationConfig,
  Domain,
  Port,
  UnixPath,
  SizeUnit,
  TimeUnit,
  URLPath,
} from "@/shared/lib/core/entities/types";

interface RouteFormState {
  isEditing: boolean;
  formData: Partial<Route>;
  isLocationModalOpen: boolean;
  editingLocationIndex: number | null;
  locationFormData: Partial<LocationConfig>;
  validationErrors: Record<string, string>;
}

interface RouteFormActions {
  setField: <K extends keyof Route>(field: K, value: Route[K]) => void;
  setAdvancedField: <K extends keyof Route["advanced"]>(
    field: K,
    value: Route["advanced"][K]
  ) => void;
  setLocationField: <K extends keyof LocationConfig>(
    field: K,
    value: LocationConfig[K]
  ) => void;
  openLocationModal: (index?: number) => void;
  closeLocationModal: () => void;
  addLocation: () => void;
  updateLocation: () => void;
  deleteLocation: (index: number) => void;
  resetForm: () => void;
  setFormData: (route: Partial<Route>) => void;
  validateForm: () => boolean;
}

const initialRouteForm: Partial<Route> = {
  domain: "" as Domain,
  port: 80 as Port,
  root: "/var/www/html" as UnixPath,
  enabled: true,
  ssl: false,
  locations: [],
  advanced: {
    client_max_body_size: "1m" as SizeUnit,
    keepalive_timeout: "65s" as TimeUnit,
    gzip: true,
    gzip_types: "text/plain text/css application/json",
    caching: false,
    cache_valid: "5m" as TimeUnit,
  },
};

const initialLocationForm: Partial<LocationConfig> = {
  path: "/" as URLPath,
  proxy_pass: undefined,
  try_files: undefined,
  index: "index.html",
  extra_directives: "",
};

export const useRouteFormStore = create<RouteFormState & RouteFormActions>()(
  devtools(
    (set, get) => ({
      isEditing: false,
      formData: { ...initialRouteForm },
      isLocationModalOpen: false,
      editingLocationIndex: null,
      locationFormData: { ...initialLocationForm },
      validationErrors: {},

      setField: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value },
          validationErrors: { ...state.validationErrors, [field]: "" },
        })),

      setAdvancedField: (field, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            advanced: {
              ...state.formData.advanced,
              [field]: value,
            } as Route["advanced"],
          },
        })),

      setLocationField: (field, value) =>
        set((state) => ({
          locationFormData: { ...state.locationFormData, [field]: value },
        })),

      openLocationModal: (index) =>
        set((state) => ({
          isLocationModalOpen: true,
          editingLocationIndex: index ?? null,
          locationFormData:
            index !== undefined && state.formData.locations?.[index]
              ? { ...state.formData.locations[index] }
              : { ...initialLocationForm },
        })),

      closeLocationModal: () =>
        set({
          isLocationModalOpen: false,
          editingLocationIndex: null,
          locationFormData: { ...initialLocationForm },
        }),

      addLocation: () =>
        set((state) => {
          const locations = state.formData.locations || [];
          const newLocation = createLocation(state.locationFormData);

          return {
            formData: {
              ...state.formData,
              locations: [...locations, newLocation],
            },
            isLocationModalOpen: false,
            locationFormData: { ...initialLocationForm },
          };
        }),

      updateLocation: () =>
        set((state) => {
          const locations = state.formData.locations
            ? [...state.formData.locations]
            : [];
          if (
            state.editingLocationIndex !== null &&
            locations[state.editingLocationIndex]
          ) {
            locations[state.editingLocationIndex] = createLocation(
              state.locationFormData
            );
          }

          return {
            formData: { ...state.formData, locations },
            isLocationModalOpen: false,
            editingLocationIndex: null,
            locationFormData: { ...initialLocationForm },
          };
        }),

      deleteLocation: (index) =>
        set((state) => {
          const locations = state.formData.locations
            ? [...state.formData.locations]
            : [];
          locations.splice(index, 1);
          return {
            formData: { ...state.formData, locations },
          };
        }),

      resetForm: () =>
        set({
          formData: { ...initialRouteForm },
          isEditing: false,
          validationErrors: {},
        }),

      setFormData: (route) =>
        set({
          formData: route,
          isEditing: !!route.id,
          validationErrors: {},
        }),

      validateForm: () => {
        const { formData } = get();
        const errors = validateForm(formData);
        set({ validationErrors: errors });
        return Object.keys(errors).length === 0;
      },
    }),
    { name: "RouteFormStore" }
  )
);
