import type { LocationConfig } from "@vlashex/core";
import { sanitizeForJson } from "@vlashex/core/security/secrets";
import { create } from "zustand";

type FormMode = "create" | "edit";

export type ActiveTab = "basic" | "locations" | "advanced" | "preview";
interface RouteFormUIState {
  modalOpen: boolean;
  mode: FormMode;
  activeTab: ActiveTab;
  locationEditing: { index: number | null; value: LocationConfig | null };
}

interface RouteFormUIActions {
  openForCreate: () => void;
  openForEdit: () => void;
  closeModal: () => void;
  setActiveTab: (tab: RouteFormUIState["activeTab"]) => void;
  startEditLocation: (
    index: number | null,
    value: LocationConfig | null
  ) => void;
}

type Store = RouteFormUIState & RouteFormUIActions;

export const useRouteFormModalStore = create<Store>()((set) => ({
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
    set({
      locationEditing: {
        index,
        value: sanitizeForJson(value) as LocationConfig | null,
      },
    }),
}));
