import { useState } from "react";
import { Input } from "@/shared/ui-kit/input";
import { Button } from "@/shared/ui-kit/button";
import { domain, urlPath } from "@/shared/lib/factories";
import type { LocationConfig } from "@/core/entities/types";
import { Loader2 } from "lucide-react";

type Props = {
  editing: { index: number | null; value: LocationConfig | null };
  onStartEditLocation: (
    index: number | null,
    value: LocationConfig | null
  ) => void;
  onSaveLocation: (value: LocationConfig) => void;
  onSaveLocationForce: (value: LocationConfig) => void;
  isSavingLocation: boolean;
};

export function LocationModal({
  editing,
  onStartEditLocation,
  onSaveLocation,
  onSaveLocationForce,
  isSavingLocation,
}: Props) {
  // 🔹 локальное состояние: какая кнопка нажата ("normal" | "force" | null)
  const [activeButton, setActiveButton] = useState<"normal" | "force" | null>(
    null
  );

  if (!editing.value) return null;
  const value = editing.value;

  // При завершении сохранения — сбрасываем активную кнопку
  if (!isSavingLocation && activeButton !== null) {
    setTimeout(() => setActiveButton(null), 0);
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto p-6">
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

        <div className="flex justify-between mt-6 space-x-3">
          <Button
            disabled={isSavingLocation}
            onClick={() => {
              setActiveButton("force");
              onSaveLocationForce(value);
            }}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isSavingLocation && activeButton === "force" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Сохранить в любом случае"
            )}
          </Button>

          <div className="flex gap-4">
            <button
              onClick={() => onStartEditLocation(null, null)}
              disabled={isSavingLocation}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-60"
            >
              Отмена
            </button>

            {/* Обычное сохранение */}
            <Button
              disabled={isSavingLocation}
              onClick={() => {
                setActiveButton("normal");
                onSaveLocation(value);
              }}
            >
              {isSavingLocation && activeButton === "normal" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
