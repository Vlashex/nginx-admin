import { useState } from "react";
import { Button } from "@vlashex/shared/ui-kit";
import type { Route } from "@vlashex/core";
import { Loader2 } from "lucide-react";

type RouteListProps = {
  list: Route[];
  isLoading: boolean;
  error?: string | null;
  onCreate: () => void;
  onEdit: (route: Route) => void;
  onToggle: (id: string) => Promise<void | null>;
  onRemove: (id: string) => Promise<void | null>;
  isRemoving: boolean;
};

export function RouteList({
  list,
  isLoading,
  error,
  onCreate,
  onEdit,
  onToggle,
  onRemove,
  isRemoving,
}: RouteListProps) {
  // 🔹 Локальное состояние: какая строка в процессе удаления
  const [activeRemoveId, setActiveRemoveId] = useState<string | null>(null);

  // после завершения удаления сбрасываем состояние
  if (!isRemoving && activeRemoveId !== null) {
    setTimeout(() => setActiveRemoveId(null), 0);
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow p-4 text-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Список маршрутов</h2>
        <Button onClick={onCreate}>Добавить маршрут</Button>
      </div>

      {isLoading && <div className="text-gray-400">Загрузка...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!isLoading && !error && (
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-xs">Домен</th>
              <th className="px-6 py-3">Порт</th>
              <th className="px-6 py-3">Тип</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {list.map((route) => (
              <tr key={route.id}>
                <td className="px-6 py-4">{route.domain}</td>
                <td className="px-6 py-4">{route.port}</td>
                <td className="px-6 py-4">
                  {route.proxy_pass ? "Прокси" : "Статика"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs rounded-full ${
                      route.enabled
                        ? "bg-green-700 text-green-200"
                        : "bg-red-700 text-red-200"
                    }`}
                  >
                    {route.enabled ? "Активен" : "Отключен"}
                  </span>
                </td>
                <td className="px-6 py-4 space-x-3 text-sm">
                  <button
                    onClick={() => onToggle(route.id)}
                    disabled={isRemoving}
                    className="text-yellow-400 hover:text-yellow-200 disabled:opacity-60"
                  >
                    {route.enabled ? "Отключить" : "Включить"}
                  </button>

                  <button
                    onClick={() => onEdit(route)}
                    disabled={isRemoving}
                    className="text-blue-400 hover:text-blue-200 disabled:opacity-60"
                  >
                    Редактировать
                  </button>

                  <button
                    onClick={() => {
                      setActiveRemoveId(route.id);
                      onRemove(route.id);
                    }}
                    disabled={isRemoving}
                    className={`
                      flex items-center justify-end w-28
                      text-red-400 hover:text-red-200
                      disabled:opacity-60
                    `}
                  >
                    {isRemoving && activeRemoveId === route.id ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Удаление...
                      </>
                    ) : (
                      <span className="ml-auto text-right w-full">Удалить</span>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
