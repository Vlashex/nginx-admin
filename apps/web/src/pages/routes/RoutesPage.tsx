import { useRoutesPage } from "@/pages/routes/model/useRoutesPage";
import { RouteList } from "./RouteList";
import { RouteModal } from "./RouteModal/RouteModal";
import { LocationModal } from "./RouteModal/LocationModal";

export default function RoutesPage() {
  const {
    list,
    isLoading,
    error,
    form,
    preview,
    isSaving,
    isRemoving,
    isSavingLocation,
    isRemovingLocation,
    onCreate,
    onEdit,
    onToggle,
    onRemove,
    onSubmit,
    onSaveForce,
    onClose,
    location,
    modal,
  } = useRoutesPage();

  return (
    <div className="space-y-4">
      <RouteList
        list={list}
        isLoading={isLoading}
        error={error}
        onCreate={onCreate}
        onEdit={onEdit}
        onToggle={onToggle}
        onRemove={onRemove}
        isRemoving={isRemoving}
      />

      <RouteModal
        isOpen={modal.isOpen}
        mode={modal.mode}
        activeTab={modal.activeTab}
        setActiveTab={modal.setActiveTab}
        form={form}
        onSubmit={onSubmit}
        onSaveRouteForce={onSaveForce}
        onClose={onClose}
        onAddLocation={location.onAdd}
        onEditLocation={location.onEdit}
        onDeleteLocation={location.onDelete}
        preview={preview}
        isSaving={isSaving}
        isRemovingLocation={isRemovingLocation}
      />

      <LocationModal
        editing={location.editing}
        onStartEditLocation={location.onStartEdit}
        onSaveLocation={location.onSave}
        onSaveLocationForce={location.onSaveForce}
        isSavingLocation={isSavingLocation}
      />
    </div>
  );
}
