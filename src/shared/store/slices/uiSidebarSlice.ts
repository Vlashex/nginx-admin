// store/slices/uiSidebarSlice.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UISidebarState {
  isSidebarOpen: boolean;
  sidebarWidth: number;
  isResizing: boolean;
}

interface UISidebarActions {
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  startResizing: () => void;
  stopResizing: () => void;
}

export const useUISidebarStore = create<UISidebarState & UISidebarActions>()(
  devtools(
    (set) => ({
      isSidebarOpen: true,
      sidebarWidth: 300,
      isResizing: false,

      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),

      setSidebarWidth: (width) =>
        set({
          sidebarWidth: Math.max(200, Math.min(500, width)),
        }),

      startResizing: () => set({ isResizing: true }),

      stopResizing: () => set({ isResizing: false }),
    }),
    { name: "UISidebarStore" }
  )
);
