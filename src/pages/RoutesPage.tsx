import { useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  validateLocation,
  createLocation,
  addLocationToRoute,
  updateLocationInRoute,
  removeLocation,
} from "@/core/useCases/routeForm";
import { routeFormResolver } from "@/shared/lib/formAdapters";
import { useRouteOperations } from "@/processes/useRouteOperations";
import {
  useRouteFormStore,
  type ActiveTab,
} from "@/shared/store/useRouteFormStore";
import { useRoutePreview } from "@/processes/useRoutePreview";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui-kit/form";
import { Input } from "@/shared/ui-kit/input";
import { Button } from "@/shared/ui-kit/button";
import { useRoutesList } from "@/processes/useRoutesList";
import type { LocationConfig, Route, URLPath } from "@/core/entities/types";
import { createRoute, domain, urlPath } from "@/shared/lib/factories";

export default function RoutesPage() {
  const { list, isLoading, error } = useRoutesList();
  const ops = useRouteOperations();
  const ui = useRouteFormStore();

  const form = useForm<Route>({
    resolver: routeFormResolver,
    defaultValues: createRoute(),
  });
  const preview = useRoutePreview(form);

  const openForCreate = useCallback(() => {
    ui.openForCreate();
    form.reset(createRoute());
  }, [form, ui]);

  const openForEdit = useCallback(
    (route: Route) => {
      ui.openForEdit(null);
      form.reset(route);
    },
    [form, ui]
  );

  const closeModal = useCallback(() => {
    ui.closeModal();
    ops.reset();
  }, [ops, ui]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (ui.mode === "create" || !values.id) {
         

        await ops.create(values);
      } else {
        const { id, ...rest } = values;
        await ops.update(id, rest);
      }
      closeModal();
    } catch {
      // state already captured in ops
    }
  });

  const addLocation = useCallback(() => {
    const loc = createLocation({ path: "/" as URLPath });
    console.log(loc);
    const uiLoc: LocationConfig = {
      path: urlPath(loc.path || "/"),
      proxy_pass: domain(""),
      try_files: loc.try_files || "",
      index: loc.index || "",
      extra_directives: loc.extra_directives || "",
    };
    console.log(uiLoc);
    ui.startEditLocation(null, uiLoc);
  }, [ui]);

  const editLocation = useCallback(
    (index: number, value: LocationConfig) => {
      console.log(index, value);
      ui.startEditLocation(index, value);
    },
    [ui]
  );

  const deleteLocation = useCallback(
    (index: number) => {
      const current = form.getValues("locations");
      const next = removeLocation(current, index);
      form.setValue("locations", next);
    },
    [form]
  );

  const saveLocation = useCallback(
    (value: LocationConfig) => {
      const errors = validateLocation(value);
      if (Object.keys(errors).length > 0) {
        return;
      }
      const current = form.getValues("locations") as LocationConfig[];
      const next =
        ui.locationEditing.index === null
          ? (addLocationToRoute(current, value) as LocationConfig[])
          : (updateLocationInRoute(
              current,
              ui.locationEditing.index!,
              value
            ) as LocationConfig[]);
      form.setValue("locations", next);
      ui.startEditLocation(null, null);
    },
    [form, ui]
  );

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg shadow p-4 text-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Список маршрутов</h2>
          <Button onClick={openForCreate}>Добавить маршрут</Button>
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
                      onClick={() => ops.toggle(route.id)}
                      className="text-yellow-400 hover:text-yellow-200"
                    >
                      {route.enabled ? "Отключить" : "Включить"}
                    </button>
                    <button
                      onClick={() => openForEdit(route)}
                      className="text-blue-400 hover:text-blue-200"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => ops.remove(route.id)}
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

      {ui.modalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto p-6 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {ui.mode === "edit"
                ? "Редактирование маршрута"
                : "Добавление маршрута"}
            </h3>

            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px">
                {(
                  ["basic", "locations", "advanced", "preview"] as ActiveTab[]
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => ui.setActiveTab(tab)}
                    className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                      ui.activeTab === tab
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
                {ui.activeTab === "basic" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="domain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Домен</FormLabel>
                            <FormControl>
                              <Input placeholder="example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Порт</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="root"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Корневая директория</FormLabel>
                            <FormControl>
                              <Input placeholder="/var/www/html" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="proxy_pass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Прокси-адрес (опционально)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="http://localhost:3000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center space-x-4 mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded"
                          checked={form.watch("enabled")}
                          onChange={(e) =>
                            form.setValue("enabled", e.target.checked)
                          }
                        />
                        <span className="ml-2">Маршрут активен</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded"
                          checked={form.watch("ssl")}
                          onChange={(e) =>
                            form.setValue("ssl", e.target.checked)
                          }
                        />
                        <span className="ml-2">Включить SSL</span>
                      </label>
                    </div>

                    {form.watch("ssl") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="ssl_certificate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SSL сертификат</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="/etc/ssl/certs/domain.crt"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ssl_certificate_key"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SSL ключ</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="/etc/ssl/private/domain.key"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </>
                )}

                {ui.activeTab === "locations" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium">Location блоки</h4>
                      <button
                        type="button"
                        onClick={addLocation}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        Добавить location
                      </button>
                    </div>
                    <div className="space-y-3">
                      {form.watch("locations").map((loc, index) => (
                        <div
                          key={index}
                          className="border rounded-md p-3 bg-gray-50"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{loc.path}</span>
                            <div>
                              <button
                                type="button"
                                onClick={() => editLocation(index, loc)}
                                className="text-blue-600 hover:text-blue-800 mr-2 text-sm"
                              >
                                Редактировать
                              </button>
                              <button
                                onClick={() => deleteLocation(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Удалить
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            {loc.proxy_pass && (
                              <div>Proxy: {loc.proxy_pass}</div>
                            )}
                            {loc.try_files && (
                              <div>Try Files: {loc.try_files}</div>
                            )}
                            {loc.index && <div>Index: {loc.index}</div>}
                          </div>
                        </div>
                      ))}
                      {form.watch("locations").length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          Нет добавленных location блоков
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {ui.activeTab === "advanced" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="advanced.client_max_body_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Максимальный размер тела запроса
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="1m" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="advanced.keepalive_timeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Таймаут keepalive</FormLabel>
                          <FormControl>
                            <Input placeholder="65s" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!form.watch("advanced.gzip")}
                        onChange={(e) =>
                          form.setValue("advanced.gzip", e.target.checked)
                        }
                      />
                      <span className="ml-2">Включить Gzip сжатие</span>
                    </label>

                    <FormField
                      control={form.control}
                      name="advanced.gzip_types"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gzip типы</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="text/plain text/css application/json"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded"
                        checked={!!form.watch("advanced.caching")}
                        onChange={(e) =>
                          form.setValue("advanced.caching", e.target.checked)
                        }
                      />
                      <span className="ml-2">Включить кэширование</span>
                    </label>

                    <FormField
                      control={form.control}
                      name="advanced.cache_valid"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Валидность кэша</FormLabel>
                          <FormControl>
                            <Input placeholder="200 302 10m" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {ui.activeTab === "preview" && (
                  <div>
                    <h4 className="text-lg font-medium mb-2">
                      Предпросмотр конфигурации
                    </h4>
                    <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm">
                      {preview}
                    </pre>
                  </div>
                )}

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Отмена
                  </button>
                  <Button type="submit" disabled={ops.loading}>
                    {ui.mode === "edit" ? "Сохранить" : "Добавить"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {ui.locationEditing.value && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
            <h3 className="text-xl font-semibold mb-4">
              Редактирование location
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Путь
                </label>
                <Input
                  value={ui.locationEditing.value.path}
                  onChange={(e) =>
                    ui.startEditLocation(ui.locationEditing.index, {
                      ...ui.locationEditing.value!,
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
                  value={ui.locationEditing.value.proxy_pass || ""}
                  onChange={(e) =>
                    ui.startEditLocation(ui.locationEditing.index, {
                      ...ui.locationEditing.value!,
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
                  value={ui.locationEditing.value.try_files || ""}
                  onChange={(e) =>
                    ui.startEditLocation(ui.locationEditing.index, {
                      ...ui.locationEditing.value!,
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
                  value={ui.locationEditing.value.index || ""}
                  onChange={(e) =>
                    ui.startEditLocation(ui.locationEditing.index, {
                      ...ui.locationEditing.value!,
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
                  value={ui.locationEditing.value.extra_directives || ""}
                  onChange={(e) =>
                    ui.startEditLocation(ui.locationEditing.index, {
                      ...ui.locationEditing.value!,
                      extra_directives: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => ui.startEditLocation(null, null)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
              <Button onClick={() => saveLocation(ui.locationEditing.value!)}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
