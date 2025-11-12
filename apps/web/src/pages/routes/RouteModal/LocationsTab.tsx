import { useState } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Button } from "@vlashex/shared/src/ui-kit/button";
import {
  LocationConfigSchema,
  type LocationConfig,
} from "@vlashex/core/entities/types";
import { Loader2 } from "lucide-react";

type Props<T extends FieldValues = FieldValues> = {
  form: UseFormReturn<T>;
  onAdd: () => void;
  onEdit: (index: number, value: LocationConfig) => void;
  onDelete: (index: number) => void;
  isRemovingLocation: boolean;
};

export function LocationsTab({
  form,
  onAdd,
  onEdit,
  onDelete,
  isRemovingLocation,
}: Props) {
  const locations = form.watch("locations") as LocationConfig[];

  const [activeDeleteIndex, setActiveDeleteIndex] = useState<number | null>(
    null
  );
  if (!isRemovingLocation && activeDeleteIndex !== null) {
    setTimeout(() => setActiveDeleteIndex(null), 0);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-medium">Location блоки</h4>
        <Button type="button" onClick={onAdd} className="text-sm">
          Добавить location
        </Button>
      </div>

      <div className="space-y-3">
        {locations.map((loc, index) => (
          <div key={index} className="border rounded-md p-3 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-medium">{loc.path}</span>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => onEdit(index, LocationConfigSchema.parse(loc))}
                  className="text-blue-600 hover:text-blue-800 mr-2 text-sm"
                  disabled={isRemovingLocation}
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDeleteIndex(index);
                    onDelete(index);
                  }}
                  disabled={isRemovingLocation}
                  className="flex items-center justify-end w-24 text-sm text-red-600 hover:text-red-800 disabled:opacity-60"
                >
                  {isRemovingLocation && activeDeleteIndex === index ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      <span>Удаление...</span>
                    </>
                  ) : (
                    <span className="ml-auto text-right w-full">Удалить</span>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {loc.proxy_pass && <div>Proxy: {loc.proxy_pass}</div>}
              {loc.try_files && <div>Try Files: {loc.try_files}</div>}
              {loc.index && <div>Index: {loc.index}</div>}
            </div>
          </div>
        ))}

        {locations.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            Нет добавленных location блоков
          </div>
        )}
      </div>
    </div>
  );
}
