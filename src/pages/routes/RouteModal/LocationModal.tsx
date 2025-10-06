import * as React from "react";
import { Input } from "@/shared/ui-kit/input";
import { Button } from "@/shared/ui-kit/button";
import { domain, urlPath } from "@/shared/lib/factories";
import type { LocationConfig } from "@/core/entities/types";

type Props = {
  editing: { index: number | null; value: LocationConfig | null };
  onStartEditLocation: (
    index: number | null,
    value: LocationConfig | null
  ) => void;
  onSaveLocation: (value: LocationConfig) => void;
};

export function LocationModal({
  editing,
  onStartEditLocation,
  onSaveLocation,
}: Props) {
  if (!editing.value) return null;

  const value = editing.value;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
        <h3 className="text-xl font-semibold mb-4">Редактирование location</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Путь
            </label>
            <Input
              value={value.path}
              onChange={(e) =>
                onStartEditLocation(editing.index, {
                  ...value,
                  path: urlPath(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Прокси-адрес (опционально)
            </label>
            <Input
              value={value.proxy_pass || ""}
              onChange={(e) =>
                onStartEditLocation(editing.index, {
                  ...value,
                  proxy_pass: domain(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Try Files (опционально)
            </label>
            <Input
              value={value.try_files || ""}
              onChange={(e) =>
                onStartEditLocation(editing.index, {
                  ...value,
                  try_files: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Index файлы (опционально)
            </label>
            <Input
              value={value.index || ""}
              onChange={(e) =>
                onStartEditLocation(editing.index, {
                  ...value,
                  index: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дополнительные директивы (опционально)
            </label>
            <textarea
              className="w-full h-20 p-2 border rounded-md font-mono text-sm"
              value={value.extra_directives || ""}
              onChange={(e) =>
                onStartEditLocation(editing.index, {
                  ...value,
                  extra_directives: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={() => onStartEditLocation(null, null)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Отмена
          </button>
          <Button onClick={() => onSaveLocation(value)}>Сохранить</Button>
        </div>
      </div>
    </div>
  );
}
