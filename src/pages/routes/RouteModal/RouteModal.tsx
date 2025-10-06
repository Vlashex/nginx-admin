import * as React from "react";
import type { ActiveTab } from "@/shared/store/useRouteFormStore";
import type { UseFormReturn } from "react-hook-form";
import { Form } from "@/shared/ui-kit/form";
import { Button } from "@/shared/ui-kit/button";
import type { LocationConfig } from "@/core/entities/types";
import { BasicTab } from "./BasicTab";
import { LocationsTab } from "./LocationsTab";
import { AdvancedTab } from "./AdvancedTab";
import { PreviewTab } from "./PreviewTab";

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  form: UseFormReturn<any>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onSaveRouteForce: () => Promise<void>;
  onClose: () => void;

  // locations
  onAddLocation: () => void;
  onEditLocation: (index: number, value: LocationConfig) => void;
  onDeleteLocation: (index: number) => void;

  preview: string;
};

export function RouteModal({
  isOpen,
  mode,
  activeTab,
  setActiveTab,
  form,
  onSubmit,
  onSaveRouteForce,
  onClose,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
  preview,
}: Props) {
  if (!isOpen) return null;

  const tabs: ActiveTab[] = ["basic", "locations", "advanced", "preview"];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto p-6 max-h-screen overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {mode === "edit" ? "Редактирование маршрута" : "Добавление маршрута"}
        </h3>

        <div className="border-b border-gray-200 mb-4">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "basic" && "Основные настройки"}
                {tab === "locations" && "Location блоки"}
                {tab === "advanced" && "Дополнительные настройки"}
                {tab === "preview" && "Предпросмотр конфига"}
              </button>
            ))}
          </nav>
        </div>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {activeTab === "basic" && <BasicTab form={form} />}
            {activeTab === "locations" && (
              <LocationsTab
                form={form}
                onAdd={onAddLocation}
                onEdit={onEditLocation}
                onDelete={onDeleteLocation}
              />
            )}
            {activeTab === "advanced" && <AdvancedTab form={form} />}
            {activeTab === "preview" && <PreviewTab preview={preview} />}

            <div className="flex justify-between mt-6 space-x-3">
              <Button
                onClick={onSaveRouteForce}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {mode === "edit" ? "Сохранить" : "Добавить"} в любом случае
              </Button>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Отмена
                </button>
                <Button type="submit">
                  {mode === "edit" ? "Сохранить" : "Добавить"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
