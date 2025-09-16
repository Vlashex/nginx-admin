import React, { useState } from "react";

// Интерфейсы данных
interface LocationConfig {
  path: string;
  proxy_pass?: string;
  try_files?: string;
  index?: string;
  extra_directives?: string;
}

interface AdvancedConfig {
  client_max_body_size: string;
  keepalive_timeout: string;
  gzip: boolean;
  gzip_types: string;
  caching: boolean;
  cache_valid: string;
}

interface Route {
  id: string;
  domain: string;
  port: number;
  root: string;
  enabled: boolean;
  ssl: boolean;
  ssl_certificate?: string;
  ssl_certificate_key?: string;
  proxy_pass?: string;
  locations: LocationConfig[];
  advanced: AdvancedConfig;
}

// Интерфейсы пропсов компонентов
interface ServerStatusProps {
  status: "running" | "stopped";
  onToggleStatus: () => void;
  stats: {
    requests: string;
    traffic: string;
    activeConnections: string;
    uptime: string;
  };
}

interface ServerStatsProps {
  stats: ServerStatusProps["stats"];
}

interface RouteListProps {
  routes: Route[];
  onEditRoute: (route: Route) => void;
  onDeleteRoute: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onAddRoute: () => void;
}

interface RouteFormProps {
  route: Route | Omit<Route, "id">;
  isEditing: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
  onLocationAdd: (location: LocationConfig) => void;
  onLocationEdit: (index: number, location: LocationConfig) => void;
  onLocationDelete: (index: number) => void;
  onLocationOpenModal: () => void;
  onFieldChange: (field: string, value: unknown) => void;
  onAdvancedFieldChange: (field: string, value: unknown) => void;
  generateConfigPreview: (route: Route) => string;
}

interface LocationFormProps {
  location: LocationConfig;
  onSubmit: (location: LocationConfig) => void;
  onCancel: () => void;
  onFieldChange: (field: string, value: string) => void;
}

interface LogViewerProps {
  logs: Array<{
    id: number;
    time: string;
    message: string;
    ip: string;
  }>;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
}

interface HeaderProps {
  serverStatus: "running" | "stopped";
  onToggleStatus: () => void;
  onToggleSidebar: () => void;
}

interface ActiveRoutesPanelProps {
  routes: Route[];
}

// Компонент: Статус сервера
const ServerStatusPanel: React.FC<ServerStatusProps> = ({
  status,
  onToggleStatus,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div
        className={`flex items-center px-3 py-1 rounded-full ${
          status === "running"
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full mr-2 ${
            status === "running" ? "bg-green-500" : "bg-red-500"
          }`}
        ></div>
        <span>{status === "running" ? "Запущен" : "Остановлен"}</span>
      </div>

      <button
        onClick={onToggleStatus}
        className={`px-4 py-2 rounded ${
          status === "running"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        } text-white`}
      >
        {status === "running" ? "Остановить" : "Запустить"}
      </button>

      <button className="p-2 rounded-full bg-gray-200 hover:bg-gray-300">
        <svg
          className="w-6 h-6 text-gray-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
};

// Компонент: Статистика сервера
const ServerStatsPanel: React.FC<ServerStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700">Запросы</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.requests}</p>
        <p className="text-sm text-gray-500">Всего обработано</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700">Трафик</h3>
        <p className="text-3xl font-bold text-green-600">{stats.traffic}</p>
        <p className="text-sm text-gray-500">Передано данных</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700">Подключения</h3>
        <p className="text-3xl font-bold text-purple-600">
          {stats.activeConnections}
        </p>
        <p className="text-sm text-gray-500">Активных соединений</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-700">Аптайм</h3>
        <p className="text-3xl font-bold text-yellow-600">{stats.uptime}</p>
        <p className="text-sm text-gray-500">Время работы</p>
      </div>
    </div>
  );
};

// Компонент: Список маршрутов
const RouteList: React.FC<RouteListProps> = ({
  routes,
  onEditRoute,
  onDeleteRoute,
  onToggleStatus,
  onAddRoute,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Управление маршрутами</h2>
        <button
          onClick={onAddRoute}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Добавить маршрут
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Домен
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Порт
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Тип
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Локации
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {routes.map((route) => (
              <tr key={route.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">
                      {route.domain}
                    </span>
                    {route.ssl && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        SSL
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.port}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {route.proxy_pass ? "Прокси" : "Статика"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {route.locations.length}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      route.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {route.enabled ? "Активен" : "Отключен"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onToggleStatus(route.id)}
                    className={`mr-2 ${
                      route.enabled
                        ? "text-yellow-600 hover:text-yellow-900"
                        : "text-green-600 hover:text-green-900"
                    }`}
                  >
                    {route.enabled ? "Отключить" : "Включить"}
                  </button>
                  <button
                    onClick={() => onEditRoute(route)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => onDeleteRoute(route.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Компонент: Форма маршрута
const RouteForm: React.FC<RouteFormProps> = ({
  route,
  isEditing,
  onSubmit,
  onCancel,
  onTabChange,
  activeTab,
  onLocationEdit,
  onLocationDelete,
  onLocationOpenModal,
  onFieldChange,
  onAdvancedFieldChange,
  generateConfigPreview,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto p-6 max-h-screen overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {isEditing ? "Редактирование маршрута" : "Добавление маршрута"}
        </h3>

        {/* Вкладки модального окна */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex -mb-px">
            <button
              onClick={() => onTabChange("basic")}
              className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "basic"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Основные настройки
            </button>
            <button
              onClick={() => onTabChange("locations")}
              className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "locations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Location блоки
            </button>
            <button
              onClick={() => onTabChange("advanced")}
              className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "advanced"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Дополнительные настройки
            </button>
            <button
              onClick={() => onTabChange("preview")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "preview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Предпросмотр конфига
            </button>
          </nav>
        </div>

        <div className="space-y-4">
          {activeTab === "basic" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Домен
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={route.domain}
                    onChange={(e) => onFieldChange("domain", e.target.value)}
                    placeholder="example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Порт
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-md"
                    value={route.port}
                    onChange={(e) =>
                      onFieldChange("port", parseInt(e.target.value))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Корневая директория
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={route.root}
                    onChange={(e) => onFieldChange("root", e.target.value)}
                    placeholder="/var/www/html"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Прокси-адрес (опционально)
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    value={route.proxy_pass || ""}
                    onChange={(e) =>
                      onFieldChange("proxy_pass", e.target.value)
                    }
                    placeholder="http://localhost:3000"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={route.enabled}
                    onChange={(e) => onFieldChange("enabled", e.target.checked)}
                  />
                  <label
                    htmlFor="enabled"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Маршрут активен
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ssl"
                    className="h-4 w-4 text-blue-600 rounded"
                    checked={route.ssl}
                    onChange={(e) => onFieldChange("ssl", e.target.checked)}
                  />
                  <label
                    htmlFor="ssl"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Включить SSL
                  </label>
                </div>
              </div>

              {route.ssl && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SSL сертификат
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={route.ssl_certificate || ""}
                      onChange={(e) =>
                        onFieldChange("ssl_certificate", e.target.value)
                      }
                      placeholder="/etc/ssl/certs/domain.crt"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SSL ключ
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-md"
                      value={route.ssl_certificate_key || ""}
                      onChange={(e) =>
                        onFieldChange("ssl_certificate_key", e.target.value)
                      }
                      placeholder="/etc/ssl/private/domain.key"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "locations" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium">Location блоки</h4>
                <button
                  onClick={onLocationOpenModal}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Добавить location
                </button>
              </div>

              <div className="space-y-3">
                {route.locations.map((location, index) => (
                  <div key={index} className="border rounded-md p-3 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{location.path}</span>
                      <div>
                        <button
                          onClick={() => onLocationEdit(index, location)}
                          className="text-blue-600 hover:text-blue-800 mr-2 text-sm"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => onLocationDelete(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {location.proxy_pass && (
                        <div>Proxy: {location.proxy_pass}</div>
                      )}
                      {location.try_files && (
                        <div>Try Files: {location.try_files}</div>
                      )}
                      {location.index && <div>Index: {location.index}</div>}
                    </div>
                  </div>
                ))}

                {route.locations.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    Нет добавленных location блоков
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Максимальный размер тела запроса
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={route.advanced.client_max_body_size}
                  onChange={(e) =>
                    onAdvancedFieldChange(
                      "client_max_body_size",
                      e.target.value
                    )
                  }
                  placeholder="1m"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Таймаут keepalive
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={route.advanced.keepalive_timeout}
                  onChange={(e) =>
                    onAdvancedFieldChange("keepalive_timeout", e.target.value)
                  }
                  placeholder="65s"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="gzip"
                  className="h-4 w-4 text-blue-600 rounded"
                  checked={route.advanced.gzip}
                  onChange={(e) =>
                    onAdvancedFieldChange("gzip", e.target.checked)
                  }
                />
                <label
                  htmlFor="gzip"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Включить Gzip сжатие
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gzip типы
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={route.advanced.gzip_types}
                  onChange={(e) =>
                    onAdvancedFieldChange("gzip_types", e.target.value)
                  }
                  placeholder="text/plain text/css application/json"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="caching"
                  className="h-4 w-4 text-blue-600 rounded"
                  checked={route.advanced.caching}
                  onChange={(e) =>
                    onAdvancedFieldChange("caching", e.target.checked)
                  }
                />
                <label
                  htmlFor="caching"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Включить кэширование
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Валидность кэша
                </label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md"
                  value={route.advanced.cache_valid}
                  onChange={(e) =>
                    onAdvancedFieldChange("cache_valid", e.target.value)
                  }
                  placeholder="200 302 10m"
                />
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div>
              <h4 className="text-lg font-medium mb-2">
                Предпросмотр конфигурации
              </h4>
              <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm">
                {generateConfigPreview(route as Route)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isEditing ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент: Форма location
const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
  onFieldChange,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
        <h3 className="text-xl font-semibold mb-4">Редактирование location</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Путь
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={location.path}
              onChange={(e) => onFieldChange("path", e.target.value)}
              placeholder="/"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Прокси-адрес (опционально)
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={location.proxy_pass || ""}
              onChange={(e) => onFieldChange("proxy_pass", e.target.value)}
              placeholder="http://localhost:3000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Try Files (опционально)
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={location.try_files || ""}
              onChange={(e) => onFieldChange("try_files", e.target.value)}
              placeholder="$uri $uri/ =404"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Index файлы (опционально)
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={location.index || ""}
              onChange={(e) => onFieldChange("index", e.target.value)}
              placeholder="index.html index.htm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Дополнительные директивы (опционально)
            </label>
            <textarea
              className="w-full h-20 p-2 border rounded-md font-mono text-sm"
              value={location.extra_directives || ""}
              onChange={(e) =>
                onFieldChange("extra_directives", e.target.value)
              }
              placeholder="expires 1y; add_header Cache-Control 'public';"
            ></textarea>
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Отмена
          </button>
          <button
            onClick={() => onSubmit(location)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

// Компонент: Просмотр логов
const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Последние записи в логах</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Время
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP адрес
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Сообщение
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entry.ip}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {entry.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Компонент: Боковая панель
const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
}) => {
  return (
    <div
      className={`bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 transition duration-200 ease-in-out`}
    >
      <div className="text-white flex items-center space-x-2 px-4">
        <svg
          className="w-8 h-8"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
        <span className="text-xl font-bold">Nginx Admin</span>
      </div>

      <nav>
        <button
          onClick={() => onTabChange("overview")}
          className={`w-full flex items-center space-x-2 py-2 px-4 rounded transition duration-200 ${
            activeTab === "overview" ? "bg-blue-600" : "hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span>Обзор</span>
        </button>

        <button
          onClick={() => onTabChange("routes")}
          className={`w-full flex items-center space-x-2 py-2 px-4 rounded transition duration-200 ${
            activeTab === "routes" ? "bg-blue-600" : "hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Маршруты</span>
        </button>

        <button
          onClick={() => onTabChange("config")}
          className={`w-full flex items-center space-x-2 py-2 px-4 rounded transition duration-200 ${
            activeTab === "config" ? "bg-blue-600" : "hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>Конфигурация</span>
        </button>

        <button
          onClick={() => onTabChange("logs")}
          className={`w-full flex items-center space-x-2 py-2 px-4 rounded transition duration-200 ${
            activeTab === "logs" ? "bg-blue-600" : "hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Логи</span>
        </button>

        <button
          onClick={() => onTabChange("statistics")}
          className={`w-full flex items-center space-x-2 py-2 px-4 rounded transition duration-200 ${
            activeTab === "statistics" ? "bg-blue-600" : "hover:bg-gray-700"
          }`}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <span>Статистика</span>
        </button>
      </nav>
    </div>
  );
};

// Компонент: Шапка
const Header: React.FC<HeaderProps> = ({
  serverStatus,
  onToggleStatus,
  onToggleSidebar,
}) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 focus:outline-none md:hidden"
        >
          <svg
            className="w-6 h-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="ml-4 text-xl font-semibold">Панель управления Nginx</h1>
      </div>

      <ServerStatusPanel
        status={serverStatus}
        onToggleStatus={onToggleStatus}
        stats={{
          requests: "12,458",
          traffic: "4.2 GB",
          activeConnections: "184",
          uptime: "12 days, 4 hrs",
        }}
      />
    </header>
  );
};

// Компонент: Панель активных маршрутов
const ActiveRoutesPanel: React.FC<ActiveRoutesPanelProps> = ({ routes }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 md:col-span-2 lg:col-span-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Активные маршруты
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {routes.slice(0, 4).map((route) => (
          <div key={route.id} className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{route.domain}</h4>
              {route.ssl && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  SSL
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">Порт: {route.port}</p>
            <p className="text-sm text-gray-600">
              Локаций: {route.locations.length}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Компонент: Конфигурация
const ConfigEditor: React.FC<{
  config: string;
  onSave: () => void;
  onChange: (config: string) => void;
}> = ({ config, onSave, onChange }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Конфигурация Nginx</h2>
      <div className="mb-4">
        <textarea
          className="w-full h-96 p-3 border rounded-md font-mono text-sm"
          value={config}
          onChange={(e) => onChange(e.target.value)}
        ></textarea>
      </div>
      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Сохранить конфигурацию
        </button>
      </div>
    </div>
  );
};

// Компонент: Статистика
const StatisticsPanel: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-semibold mb-4">Статистика запросов</h2>
      <div className="h-64 flex items-center justify-center border rounded-md bg-gray-50">
        <p className="text-gray-500">Здесь будет график статистики запросов</p>
      </div>
    </div>
  );
};

// Главный компонент приложения
const NginxAdminPanel = () => {
  // Состояния для управления интерфейсом
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [serverStatus, setServerStatus] = useState("running");
  const [config, setConfig] = useState(`server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}`);

  // Состояния для управления маршрутами
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: "1",
      domain: "example.com",
      port: 80,
      root: "/var/www/html",
      enabled: true,
      ssl: false,
      locations: [
        {
          path: "/",
          try_files: "$uri $uri/ =404",
          index: "index.html index.htm",
        },
      ],
      advanced: {
        client_max_body_size: "1m",
        keepalive_timeout: "65s",
        gzip: true,
        gzip_types:
          "text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript",
        caching: true,
        cache_valid: "200 302 10m",
      },
    },
    {
      id: "2",
      domain: "api.example.com",
      port: 80,
      root: "/var/www/api",
      enabled: true,
      ssl: true,
      ssl_certificate: "/etc/ssl/certs/api.example.com.crt",
      ssl_certificate_key: "/etc/ssl/private/api.example.com.key",
      proxy_pass: "http://localhost:3000",
      locations: [
        {
          path: "/",
          proxy_pass: "http://localhost:3000",
          extra_directives: "proxy_set_header X-Real-IP $remote_addr;",
        },
        {
          path: "/static",
          //   root: "/var/www/api/static",
          try_files: "$uri $uri/ =404",
          extra_directives:
            'expires 1y; add_header Cache-Control "public, immutable";',
        },
      ],
      advanced: {
        client_max_body_size: "10m",
        keepalive_timeout: "75s",
        gzip: true,
        gzip_types: "application/json",
        caching: false,
        cache_valid: "200 302 5m",
      },
    },
  ]);

  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState("basic");
  const [newLocation, setNewLocation] = useState<LocationConfig>({
    path: "/",
    try_files: "$uri $uri/ =404",
    index: "index.html index.htm",
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocationIndex, setEditingLocationIndex] = useState<
    number | null
  >(null);

  const defaultRoute: Omit<Route, "id"> = {
    domain: "",
    port: 80,
    root: "/var/www/html",
    enabled: true,
    ssl: false,
    locations: [
      {
        path: "/",
        try_files: "$uri $uri/ =404",
        index: "index.html index.htm",
      },
    ],
    advanced: {
      client_max_body_size: "1m",
      keepalive_timeout: "65s",
      gzip: true,
      gzip_types:
        "text/plain text/css application/json application/javascript text-xml application/xml application/xml+rss text/javascript",
      caching: true,
      cache_valid: "200 302 10m",
    },
  };

  const [newRoute, setNewRoute] = useState<Omit<Route, "id">>(defaultRoute);

  // Моковые данные для демонстрации
  const serverStats = {
    requests: "12,458",
    traffic: "4.2 GB",
    activeConnections: "184",
    uptime: "12 days, 4 hrs",
  };

  const logEntries = [
    {
      id: 1,
      time: "12:30:45",
      message: "GET /index.html 200",
      ip: "192.168.1.1",
    },
    {
      id: 2,
      time: "12:30:43",
      message: "GET /style.css 200",
      ip: "192.168.1.2",
    },
    {
      id: 3,
      time: "12:30:40",
      message: "GET /api/data 200",
      ip: "192.168.1.3",
    },
    {
      id: 4,
      time: "12:30:38",
      message: "GET /favicon.ico 404",
      ip: "192.168.1.4",
    },
  ];

  // Функции для обработки действий
  const toggleServerStatus = () => {
    setServerStatus(serverStatus === "running" ? "stopped" : "running");
  };

  const handleSaveConfig = () => {
    alert("Конфигурация сохранена!");
  };

  // Функции для управления маршрутами
  const handleAddRoute = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setRoutes([...routes, { ...newRoute, id: newId }]);
    setIsRouteModalOpen(false);
    setNewRoute(defaultRoute);
    setModalActiveTab("basic");
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(JSON.parse(JSON.stringify(route)));
    setIsRouteModalOpen(true);
    setModalActiveTab("basic");
  };

  const handleUpdateRoute = () => {
    if (!editingRoute) return;

    setRoutes(
      routes.map((route) =>
        route.id === editingRoute.id ? editingRoute : route
      )
    );
    setIsRouteModalOpen(false);
    setEditingRoute(null);
    setModalActiveTab("basic");
  };

  const handleDeleteRoute = (id: string) => {
    if (window.confirm("Вы уверены, что хотите удалить этот маршрут?")) {
      setRoutes(routes.filter((route) => route.id !== id));
    }
  };

  const toggleRouteStatus = (id: string) => {
    setRoutes(
      routes.map((route) =>
        route.id === id ? { ...route, enabled: !route.enabled } : route
      )
    );
  };

  // Функции для управления location блоками
  const addLocation = () => {
    const route = editingRoute || newRoute;
    const updatedLocations = [...route.locations, newLocation];

    if (editingRoute) {
      setEditingRoute({ ...editingRoute, locations: updatedLocations });
    } else {
      setNewRoute({ ...newRoute, locations: updatedLocations });
    }

    setIsLocationModalOpen(false);
    setNewLocation({
      path: "/",
      try_files: "$uri $uri/ =404",
      index: "index.html index.htm",
    });
  };

  const updateLocation = () => {
    if (editingLocationIndex === null) return;

    const route = editingRoute || newRoute;
    const updatedLocations = [...route.locations];
    updatedLocations[editingLocationIndex] = newLocation;

    if (editingRoute) {
      setEditingRoute({ ...editingRoute, locations: updatedLocations });
    } else {
      setNewRoute({ ...newRoute, locations: updatedLocations });
    }

    setIsLocationModalOpen(false);
    setEditingLocationIndex(null);
    setNewLocation({
      path: "/",
      try_files: "$uri $uri/ =404",
      index: "index.html index.htm",
    });
  };

  const editLocation = (index: number) => {
    const route = editingRoute || newRoute;
    setNewLocation({ ...route.locations[index] });
    setEditingLocationIndex(index);
    setIsLocationModalOpen(true);
  };

  const deleteLocation = (index: number) => {
    const route = editingRoute || newRoute;
    const updatedLocations = route.locations.filter((_, i) => i !== index);

    if (editingRoute) {
      setEditingRoute({ ...editingRoute, locations: updatedLocations });
    } else {
      setNewRoute({ ...newRoute, locations: updatedLocations });
    }
  };

  // Генерация конфигурации для предпросмотра
  const generateConfigPreview = (route: Route) => {
    let config = `server {\n`;
    config += `    listen ${route.port}${route.ssl ? " ssl" : ""};\n`;
    config += `    server_name ${route.domain};\n`;
    config += `    root ${route.root};\n\n`;

    if (route.ssl) {
      config += `    ssl_certificate ${route.ssl_certificate};\n`;
      config += `    ssl_certificate_key ${route.ssl_certificate_key};\n\n`;
    }

    config += `    client_max_body_size ${route.advanced.client_max_body_size};\n`;
    config += `    keepalive_timeout ${route.advanced.keepalive_timeout};\n\n`;

    if (route.advanced.gzip) {
      config += `    gzip on;\n`;
      config += `    gzip_types ${route.advanced.gzip_types};\n\n`;
    }

    route.locations.forEach((location) => {
      config += `    location ${location.path} {\n`;
      if (location.proxy_pass)
        config += `        proxy_pass ${location.proxy_pass};\n`;
      if (location.try_files)
        config += `        try_files ${location.try_files};\n`;
      if (location.index) config += `        index ${location.index};\n`;
      if (location.extra_directives)
        config += `        ${location.extra_directives}\n`;
      config += `    }\n\n`;
    });

    config += `}`;
    return config;
  };

  // Обработчики изменений полей формы
  const handleFieldChange = (field: string, value: unknown) => {
    if (editingRoute) {
      setEditingRoute({ ...editingRoute, [field]: value });
    } else {
      setNewRoute({ ...newRoute, [field]: value });
    }
  };

  const handleAdvancedFieldChange = (field: string, value: unknown) => {
    if (editingRoute) {
      setEditingRoute({
        ...editingRoute,
        advanced: { ...editingRoute.advanced, [field]: value },
      });
    } else {
      setNewRoute({
        ...newRoute,
        advanced: { ...newRoute.advanced, [field]: value },
      });
    }
  };

  const handleLocationFieldChange = (field: string, value: string) => {
    setNewLocation({ ...newLocation, [field]: value });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={sidebarOpen}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          serverStatus={serverStatus as "running" | "stopped"}
          onToggleStatus={toggleServerStatus}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {activeTab === "overview" && (
            <>
              <ServerStatsPanel stats={serverStats} />
              <ActiveRoutesPanel routes={routes.filter((r) => r.enabled)} />
            </>
          )}

          {activeTab === "routes" && (
            <RouteList
              routes={routes}
              onEditRoute={handleEditRoute}
              onDeleteRoute={handleDeleteRoute}
              onToggleStatus={toggleRouteStatus}
              onAddRoute={() => setIsRouteModalOpen(true)}
            />
          )}

          {activeTab === "config" && (
            <ConfigEditor
              config={config}
              onSave={handleSaveConfig}
              onChange={setConfig}
            />
          )}

          {activeTab === "logs" && <LogViewer logs={logEntries} />}

          {activeTab === "statistics" && <StatisticsPanel />}
        </main>
      </div>

      {/* Модальное окно для добавления/редактирования маршрута */}
      {isRouteModalOpen && (
        <RouteForm
          route={editingRoute || newRoute}
          isEditing={!!editingRoute}
          onSubmit={editingRoute ? handleUpdateRoute : handleAddRoute}
          onCancel={() => {
            setIsRouteModalOpen(false);
            setEditingRoute(null);
            setModalActiveTab("basic");
          }}
          onTabChange={setModalActiveTab}
          activeTab={modalActiveTab}
          onLocationAdd={addLocation}
          onLocationEdit={editLocation}
          onLocationDelete={deleteLocation}
          onLocationOpenModal={() => {
            setNewLocation({
              path: "/",
              try_files: "$uri $uri/ =404",
              index: "index.html index.htm",
            });
            setEditingLocationIndex(null);
            setIsLocationModalOpen(true);
          }}
          onFieldChange={handleFieldChange}
          onAdvancedFieldChange={handleAdvancedFieldChange}
          generateConfigPreview={generateConfigPreview}
        />
      )}

      {/* Модальное окно для добавления/редактирования location */}
      {isLocationModalOpen && (
        <LocationForm
          location={newLocation}
          onSubmit={
            editingLocationIndex !== null ? updateLocation : addLocation
          }
          onCancel={() => {
            setIsLocationModalOpen(false);
            setEditingLocationIndex(null);
            setNewLocation({
              path: "/",
              try_files: "$uri $uri/ =404",
              index: "index.html index.htm",
            });
          }}
          onFieldChange={handleLocationFieldChange}
        />
      )}
    </div>
  );
};

export default NginxAdminPanel;
