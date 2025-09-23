import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRoutesStore } from "@/shared/store/slices/routesSlice";
import { generateConfigPreview } from "@/core/services/ConfigGenerator";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

type FormMode = "create" | "edit";

const advancedSchema = z.object({
  client_max_body_size: z.string().min(1),
  keepalive_timeout: z.string().min(1),
  gzip: z.boolean().default(false),
  gzip_types: z.string().default(""),
  caching: z.boolean().default(false),
  cache_valid: z.string().default(""),
});

const locationSchema = z.object({
  path: z.string().min(1),
  proxy_pass: z.string().optional().or(z.literal("")),
  try_files: z.string().optional().or(z.literal("")),
  index: z.string().optional().or(z.literal("")),
  extra_directives: z.string().optional().or(z.literal("")),
});

const routeSchema = z.object({
  id: z.string().optional(),
  domain: z.string().min(1, "Домен обязателен"),
  port: z.coerce.number().int().min(1).max(65535),
  root: z.string().min(1, "Корневая директория обязательна"),
  enabled: z.boolean().default(true),
  ssl: z.boolean().default(false),
  ssl_certificate: z.string().optional().or(z.literal("")),
  ssl_certificate_key: z.string().optional().or(z.literal("")),
  proxy_pass: z.string().optional().or(z.literal("")),
  locations: z.array(locationSchema).default([]),
  advanced: advancedSchema.default({
    client_max_body_size: "1m",
    keepalive_timeout: "65s",
    gzip: false,
    gzip_types: "",
    caching: false,
    cache_valid: "",
  }),
});

type RouteFormValues = z.infer<typeof routeSchema>;
type LocationFormValues = z.infer<typeof locationSchema>;

function useRoutesList() {
  const { routes, isLoading, error, loadRoutes } = useRoutesStore();

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const list = useMemo(() => Array.from(routes.values()), [routes]);
  return { list, isLoading, error };
}

export default function RoutesPage() {
  const { list, isLoading, error } = useRoutesList();
  const {
    addRoute,
    updateRoute: updateRouteUseCase,
    deleteRoute,
    toggleRouteStatus,
  } = useRoutesStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<FormMode>("create");
  const [activeTab, setActiveTab] = useState<
    "basic" | "locations" | "advanced" | "preview"
  >("basic");
  const [opState, setOpState] = useState<{
    loading: boolean;
    error: string | null;
    success: string | null;
  }>({ loading: false, error: null, success: null });
  const [locationEditing, setLocationEditing] = useState<{
    index: number | null;
    value: LocationFormValues | null;
  }>({ index: null, value: null });

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      domain: "",
      port: 80,
      root: "",
      enabled: true,
      ssl: false,
      ssl_certificate: "",
      ssl_certificate_key: "",
      proxy_pass: "",
      locations: [],
      advanced: {
        client_max_body_size: "1m",
        keepalive_timeout: "65s",
        gzip: false,
        gzip_types: "",
        caching: false,
        cache_valid: "",
      },
    },
  });

  const openForCreate = useCallback(() => {
    setMode("create");
    setActiveTab("basic");
    form.reset();
    setModalOpen(true);
  }, [form]);

  const openForEdit = useCallback(
    (route: RouteFormValues) => {
      setMode("edit");
      setActiveTab("basic");
      form.reset(route);
      setModalOpen(true);
    },
    [form]
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setOpState({ loading: false, error: null, success: null });
    setLocationEditing({ index: null, value: null });
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    setOpState({ loading: true, error: null, success: null });
    try {
      if (mode === "create" || !values.id) {
        const { id: _, ...data } = values;
        await addRoute({
          domain: data.domain as any,
          port: data.port as any,
          root: data.root as any,
          enabled: data.enabled,
          ssl: data.ssl,
          ssl_certificate: data.ssl_certificate || undefined,
          ssl_certificate_key: data.ssl_certificate_key || undefined,
          proxy_pass: data.proxy_pass || undefined,
          locations: data.locations as any,
          advanced: data.advanced as any,
        });
        setOpState({ loading: false, error: null, success: "Сохранено" });
      } else {
        const { id, ...rest } = values;
        await updateRouteUseCase(id!, {
          ...rest,
          ssl_certificate: rest.ssl_certificate || undefined,
          ssl_certificate_key: rest.ssl_certificate_key || undefined,
          proxy_pass: rest.proxy_pass || undefined,
        } as any);
        setOpState({ loading: false, error: null, success: "Обновлено" });
      }
      closeModal();
    } catch (e) {
      setOpState({
        loading: false,
        error: (e as Error).message,
        success: null,
      });
    }
  });

  const addLocation = useCallback(() => {
    setLocationEditing({
      index: null,
      value: {
        path: "/",
        try_files: "",
        index: "",
        extra_directives: "",
        proxy_pass: "",
      },
    });
  }, []);

  const editLocation = useCallback(
    (index: number, value: LocationFormValues) => {
      setLocationEditing({ index, value });
    },
    []
  );

  const deleteLocation = useCallback(
    (index: number) => {
      const current = form.getValues("locations");
      form.setValue(
        "locations",
        current.filter((_, i) => i !== index)
      );
    },
    [form]
  );

  const saveLocation = useCallback(
    (value: LocationFormValues) => {
      const current = [...form.getValues("locations")];
      if (locationEditing.index === null) {
        current.push(value);
      } else {
        current[locationEditing.index] = value;
      }
      form.setValue("locations", current);
      setLocationEditing({ index: null, value: null });
    },
    [form, locationEditing.index]
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
                      onClick={() => toggleRouteStatus(route.id)}
                      className="text-yellow-400 hover:text-yellow-200"
                    >
                      {route.enabled ? "Отключить" : "Включить"}
                    </button>
                    <button
                      onClick={() => openForEdit(route as any)}
                      className="text-blue-400 hover:text-blue-200"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteRoute(route.id)}
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

      {modalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto p-6 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">
              {mode === "edit"
                ? "Редактирование маршрута"
                : "Добавление маршрута"}
            </h3>

            <div className="border-b border-gray-200 mb-4">
              <nav className="flex -mb-px">
                {["basic", "locations", "advanced", "preview"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
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
                {activeTab === "basic" && (
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

                {activeTab === "locations" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium">Location блоки</h4>
                      <button
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

                {activeTab === "advanced" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={"advanced.client_max_body_size" as any}
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
                      name={"advanced.keepalive_timeout" as any}
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
                        checked={form.watch("advanced.gzip")}
                        onChange={(e) =>
                          form.setValue("advanced.gzip", e.target.checked)
                        }
                      />
                      <span className="ml-2">Включить Gzip сжатие</span>
                    </label>

                    <FormField
                      control={form.control}
                      name={"advanced.gzip_types" as any}
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
                        checked={form.watch("advanced.caching")}
                        onChange={(e) =>
                          form.setValue("advanced.caching", e.target.checked)
                        }
                      />
                      <span className="ml-2">Включить кэширование</span>
                    </label>

                    <FormField
                      control={form.control}
                      name={"advanced.cache_valid" as any}
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

                {activeTab === "preview" && (
                  <div>
                    <h4 className="text-lg font-medium mb-2">
                      Предпросмотр конфигурации
                    </h4>
                    <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm">
                      {generateConfigPreview({
                        id: form.getValues("id") || "preview",
                        domain: form.getValues("domain") as any,
                        port: form.getValues("port") as any,
                        root: form.getValues("root") as any,
                        enabled: form.getValues("enabled"),
                        ssl: form.getValues("ssl"),
                        ssl_certificate:
                          form.getValues("ssl_certificate") || undefined,
                        ssl_certificate_key:
                          form.getValues("ssl_certificate_key") || undefined,
                        proxy_pass: form.getValues("proxy_pass") || undefined,
                        locations: form.getValues("locations") as any,
                        advanced: form.getValues("advanced") as any,
                      })}
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
                  <Button type="submit" disabled={opState.loading}>
                    {mode === "edit" ? "Сохранить" : "Добавить"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      {locationEditing.value && (
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
                  value={locationEditing.value.path}
                  onChange={(e) =>
                    setLocationEditing((s) => ({
                      ...s,
                      value: { ...s.value!, path: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Прокси-адрес (опционально)
                </label>
                <Input
                  value={locationEditing.value.proxy_pass || ""}
                  onChange={(e) =>
                    setLocationEditing((s) => ({
                      ...s,
                      value: { ...s.value!, proxy_pass: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Try Files (опционально)
                </label>
                <Input
                  value={locationEditing.value.try_files || ""}
                  onChange={(e) =>
                    setLocationEditing((s) => ({
                      ...s,
                      value: { ...s.value!, try_files: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Index файлы (опционально)
                </label>
                <Input
                  value={locationEditing.value.index || ""}
                  onChange={(e) =>
                    setLocationEditing((s) => ({
                      ...s,
                      value: { ...s.value!, index: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Дополнительные директивы (опционально)
                </label>
                <textarea
                  className="w-full h-20 p-2 border rounded-md font-mono text-sm"
                  value={locationEditing.value.extra_directives || ""}
                  onChange={(e) =>
                    setLocationEditing((s) => ({
                      ...s,
                      value: { ...s.value!, extra_directives: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setLocationEditing({ index: null, value: null })}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Отмена
              </button>
              <Button onClick={() => saveLocation(locationEditing.value!)}>
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
