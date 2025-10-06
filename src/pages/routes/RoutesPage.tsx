import * as React from "react";
import { useRoutesPage } from "@/core/useCases/useRoutesPage";
import { RouteList } from "./RouteList";
import { RouteModal } from "./RouteModal/RouteModal";
import { LocationModal } from "./RouteModal/LocationModal";

export default function RoutesPage() {
  const {
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
  } = useRoutesPage();

  return (
    <div className="space-y-4">
      <RouteList
        list={list}
        isLoading={isLoading}
        error={error}
        onCreate={openForCreate}
        onEdit={openForEdit}
        onToggle={ops.toggle}
        onRemove={ops.remove}
      />

      <RouteModal
        isOpen={ui.modalOpen}
        mode={ui.mode}
        activeTab={ui.activeTab}
        setActiveTab={ui.setActiveTab}
        form={form}
        onSubmit={onSubmit}
        onSaveRouteForce={saveRouteForce}
        onClose={closeModal}
        onAddLocation={addLocation}
        onEditLocation={editLocation}
        onDeleteLocation={deleteLocation}
        preview={preview}
      />

      <LocationModal
        editing={ui.locationEditing}
        onStartEditLocation={ui.startEditLocation}
        onSaveLocation={saveLocation}
        onSaveLocationForce={saveLocationForce}
      />
    </div>
  );
}
