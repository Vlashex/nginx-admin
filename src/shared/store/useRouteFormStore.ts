import { create } from "zustand";

type FormMode = "create" | "edit";

export type LocationFormValues = {
  path: string;
  proxy_pass?: string;
  try_files?: string;
  index?: string;
  extra_directives?: string;
};

interface RouteFormUIState {
  modalOpen: boolean;
  mode: FormMode;
  activeTab: "basic" | "locations" | "advanced" | "preview";
  locationEditing: { index: number | null; value: LocationFormValues | null };
}

interface RouteFormUIActions {
  openForCreate: () => void;
  openForEdit: (value: LocationFormValues | null) => void;
  closeModal: () => void;
  setActiveTab: (tab: RouteFormUIState["activeTab"]) => void;
  startEditLocation: (
    index: number | null,
    value: LocationFormValues | null
  ) => void;
}

type Store = RouteFormUIState & RouteFormUIActions;

export const useRouteFormStore = create<Store>()((set) => ({
  modalOpen: false,
  mode: "create",
  activeTab: "basic",
  locationEditing: { index: null, value: null },

  openForCreate: () =>
    set({ modalOpen: true, mode: "create", activeTab: "basic" }),
  openForEdit: () => set({ modalOpen: true, mode: "edit", activeTab: "basic" }),
  closeModal: () =>
    set({ modalOpen: false, locationEditing: { index: null, value: null } }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  startEditLocation: (index, value) =>
    set({ locationEditing: { index, value } }),
}));
