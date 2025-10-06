import { Button } from "@/shared/ui-kit/button";
import * as React from "react";
import type { Route } from "@/core/entities/types";

type RouteListProps = {
  list: Route[];
  isLoading: boolean;
  error?: string | null;
  onCreate: () => void;
  onEdit: (route: Route) => void;
  onToggle: (id: string) => Promise<void | null>;
  onRemove: (id: string) => Promise<void | null>;
};

export function RouteList({
  list,
  isLoading,
  error,
  onCreate,
  onEdit,
  onToggle,
  onRemove,
}: RouteListProps) {
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
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => onToggle(route.id)}
                    className="text-yellow-400 hover:text-yellow-200"
                  >
                    {route.enabled ? "Отключить" : "Включить"}
                  </button>
                  <button
                    onClick={() => onEdit(route)}
                    className="text-blue-400 hover:text-blue-200"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => onRemove(route.id)}
                    className="text-red-400 hover:text-red-200"
                  >
                    Удалить
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
