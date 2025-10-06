import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/shared/ui-kit/button";
import {
  LocationConfigSchema,
  type LocationConfig,
} from "@/core/entities/types";

type Props = {
  form: UseFormReturn<any>;
  onAdd: () => void;
  onEdit: (index: number, value: LocationConfig) => void;
  onDelete: (index: number) => void;
};

export function LocationsTab({ form, onAdd, onEdit, onDelete }: Props) {
  const locations = form.watch("locations") as LocationConfig[];

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
              <div>
                <button
                  type="button"
                  onClick={() => onEdit(index, LocationConfigSchema.parse(loc))}
                  className="text-blue-600 hover:text-blue-800 mr-2 text-sm"
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Удалить
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
