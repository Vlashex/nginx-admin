// import { useState } from "react";
// import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// const RouteForm = ({
//   route,
//   isEditing,
//   onSubmit,
//   onCancel,
//   onTabChange,
//   activeTab,
//   onLocationEdit,
//   onLocationDelete,
//   onLocationOpenModal,
//   onFieldChange,
//   onAdvancedFieldChange,
//   generateConfigPreview,
// }) => {
//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
//       <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto p-6 max-h-screen overflow-y-auto">
//         <h3 className="text-xl font-semibold mb-4">
//           {isEditing ? "Редактирование маршрута" : "Добавление маршрута"}
//         </h3>

//         <div className="border-b border-gray-200 mb-4">
//           <nav className="flex -mb-px">
//             {["basic", "locations", "advanced", "preview"].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => onTabChange(tab)}
//                 className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
//                   activeTab === tab
//                     ? "border-blue-500 text-blue-600"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                 }`}
//               >
//                 {tab === "basic" && "Основные настройки"}
//                 {tab === "locations" && "Location блоки"}
//                 {tab === "advanced" && "Дополнительные настройки"}
//                 {tab === "preview" && "Предпросмотр конфига"}
//               </button>
//             ))}
//           </nav>
//         </div>

//         <div className="space-y-4">
//           {activeTab === "basic" && (
//             <>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Домен
//                   </label>
//                   <input
//                     type="text"
//                     className="w-full p-2 border rounded-md"
//                     value={route.domain}
//                     onChange={(e) => onFieldChange("domain", e.target.value)}
//                     placeholder="example.com"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Порт
//                   </label>
//                   <input
//                     type="number"
//                     className="w-full p-2 border rounded-md"
//                     value={route.port}
//                     onChange={(e) =>
//                       onFieldChange("port", parseInt(e.target.value))
//                     }
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Корневая директория
//                   </label>
//                   <input
//                     type="text"
//                     className="w-full p-2 border rounded-md"
//                     value={route.root}
//                     onChange={(e) => onFieldChange("root", e.target.value)}
//                     placeholder="/var/www/html"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Прокси-адрес (опционально)
//                   </label>
//                   <input
//                     type="text"
//                     className="w-full p-2 border rounded-md"
//                     value={route.proxy_pass || ""}
//                     onChange={(e) =>
//                       onFieldChange("proxy_pass", e.target.value)
//                     }
//                     placeholder="http://localhost:3000"
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center space-x-4 mt-4">
//                 <label className="flex items-center">
//                   <input
//                     type="checkbox"
//                     checked={route.enabled}
//                     onChange={(e) => onFieldChange("enabled", e.target.checked)}
//                     className="h-4 w-4 text-blue-600 rounded"
//                   />
//                   <span className="ml-2">Маршрут активен</span>
//                 </label>

//                 <label className="flex items-center">
//                   <input
//                     type="checkbox"
//                     checked={route.ssl}
//                     onChange={(e) => onFieldChange("ssl", e.target.checked)}
//                     className="h-4 w-4 text-blue-600 rounded"
//                   />
//                   <span className="ml-2">Включить SSL</span>
//                 </label>
//               </div>

//               {route.ssl && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       SSL сертификат
//                     </label>
//                     <input
//                       type="text"
//                       className="w-full p-2 border rounded-md"
//                       value={route.ssl_certificate || ""}
//                       onChange={(e) =>
//                         onFieldChange("ssl_certificate", e.target.value)
//                       }
//                       placeholder="/etc/ssl/certs/domain.crt"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       SSL ключ
//                     </label>
//                     <input
//                       type="text"
//                       className="w-full p-2 border rounded-md"
//                       value={route.ssl_certificate_key || ""}
//                       onChange={(e) =>
//                         onFieldChange("ssl_certificate_key", e.target.value)
//                       }
//                       placeholder="/etc/ssl/private/domain.key"
//                     />
//                   </div>
//                 </div>
//               )}
//             </>
//           )}

//           {activeTab === "locations" && (
//             <div>
//               <div className="flex justify-between items-center mb-4">
//                 <h4 className="text-lg font-medium">Location блоки</h4>
//                 <button
//                   onClick={onLocationOpenModal}
//                   className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
//                 >
//                   Добавить location
//                 </button>
//               </div>

//               <div className="space-y-3">
//                 {route.locations.map((location, index) => (
//                   <div key={index} className="border rounded-md p-3 bg-gray-50">
//                     <div className="flex justify-between items-center">
//                       <span className="font-medium">{location.path}</span>
//                       <div>
//                         <button
//                           onClick={() => onLocationEdit(index, location)}
//                           className="text-blue-600 hover:text-blue-800 mr-2 text-sm"
//                         >
//                           Редактировать
//                         </button>
//                         <button
//                           onClick={() => onLocationDelete(index)}
//                           className="text-red-600 hover:text-red-800 text-sm"
//                         >
//                           Удалить
//                         </button>
//                       </div>
//                     </div>
//                     <div className="mt-2 text-sm text-gray-600">
//                       {location.proxy_pass && (
//                         <div>Proxy: {location.proxy_pass}</div>
//                       )}
//                       {location.try_files && (
//                         <div>Try Files: {location.try_files}</div>
//                       )}
//                       {location.index && <div>Index: {location.index}</div>}
//                     </div>
//                   </div>
//                 ))}

//                 {route.locations.length === 0 && (
//                   <div className="text-center py-4 text-gray-500">
//                     Нет добавленных location блоков
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {activeTab === "advanced" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Максимальный размер тела запроса
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border rounded-md"
//                   value={route.advanced.client_max_body_size}
//                   onChange={(e) =>
//                     onAdvancedFieldChange(
//                       "client_max_body_size",
//                       e.target.value
//                     )
//                   }
//                   placeholder="1m"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Таймаут keepalive
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border rounded-md"
//                   value={route.advanced.keepalive_timeout}
//                   onChange={(e) =>
//                     onAdvancedFieldChange("keepalive_timeout", e.target.value)
//                   }
//                   placeholder="65s"
//                 />
//               </div>

//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={route.advanced.gzip}
//                   onChange={(e) =>
//                     onAdvancedFieldChange("gzip", e.target.checked)
//                   }
//                   className="h-4 w-4 text-blue-600 rounded"
//                 />
//                 <span className="ml-2">Включить Gzip сжатие</span>
//               </label>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Gzip типы
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border rounded-md"
//                   value={route.advanced.gzip_types}
//                   onChange={(e) =>
//                     onAdvancedFieldChange("gzip_types", e.target.value)
//                   }
//                   placeholder="text/plain text/css application/json"
//                 />
//               </div>

//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={route.advanced.caching}
//                   onChange={(e) =>
//                     onAdvancedFieldChange("caching", e.target.checked)
//                   }
//                   className="h-4 w-4 text-blue-600 rounded"
//                 />
//                 <span className="ml-2">Включить кэширование</span>
//               </label>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Валидность кэша
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border rounded-md"
//                   value={route.advanced.cache_valid}
//                   onChange={(e) =>
//                     onAdvancedFieldChange("cache_valid", e.target.value)
//                   }
//                   placeholder="200 302 10m"
//                 />
//               </div>
//             </div>
//           )}

//           {activeTab === "preview" && (
//             <div>
//               <h4 className="text-lg font-medium mb-2">
//                 Предпросмотр конфигурации
//               </h4>
//               <pre className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto text-sm">
//                 {generateConfigPreview(route)}
//               </pre>
//             </div>
//           )}
//         </div>

//         <div className="flex justify-end mt-6 space-x-3">
//           <button
//             onClick={onCancel}
//             className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
//           >
//             Отмена
//           </button>
//           <button
//             onClick={onSubmit}
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             {isEditing ? "Сохранить" : "Добавить"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const LocationForm = ({ location, onSubmit, onCancel, onFieldChange }) => {
//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
//       <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6">
//         <h3 className="text-xl font-semibold mb-4">Редактирование location</h3>

//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Путь
//             </label>
//             <input
//               type="text"
//               className="w-full p-2 border rounded-md"
//               value={location.path}
//               onChange={(e) => onFieldChange("path", e.target.value)}
//               placeholder="/"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Прокси-адрес (опционально)
//             </label>
//             <input
//               type="text"
//               className="w-full p-2 border rounded-md"
//               value={location.proxy_pass || ""}
//               onChange={(e) => onFieldChange("proxy_pass", e.target.value)}
//               placeholder="http://localhost:3000"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Try Files (опционально)
//             </label>
//             <input
//               type="text"
//               className="w-full p-2 border rounded-md"
//               value={location.try_files || ""}
//               onChange={(e) => onFieldChange("try_files", e.target.value)}
//               placeholder="$uri $uri/ =404"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Index файлы (опционально)
//             </label>
//             <input
//               type="text"
//               className="w-full p-2 border rounded-md"
//               value={location.index || ""}
//               onChange={(e) => onFieldChange("index", e.target.value)}
//               placeholder="index.html index.htm"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Дополнительные директивы (опционально)
//             </label>
//             <textarea
//               className="w-full h-20 p-2 border rounded-md font-mono text-sm"
//               value={location.extra_directives || ""}
//               onChange={(e) =>
//                 onFieldChange("extra_directives", e.target.value)
//               }
//               placeholder="expires 1y; add_header Cache-Control 'public';"
//             ></textarea>
//           </div>
//         </div>

//         <div className="flex justify-end mt-6 space-x-3">
//           <button
//             onClick={onCancel}
//             className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
//           >
//             Отмена
//           </button>
//           <button
//             onClick={() => onSubmit(location)}
//             className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Сохранить
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Sidebar = ({ isOpen }) => (
//   <div
//     className={`bg-gray-900 text-gray-200 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${
//       isOpen ? "translate-x-0" : "-translate-x-full"
//     } md:relative md:translate-x-0 transition duration-200 ease-in-out`}
//   >
//     <div className="text-white flex items-center space-x-2 px-4 mb-6">
//       <span className="text-xl font-bold">Nginx Admin</span>
//     </div>

//     <nav className="flex flex-col space-y-2">
//       <Link to="/" className="px-4 py-2 rounded hover:bg-gray-700">
//         Обзор
//       </Link>
//       <Link to="/routes" className="px-4 py-2 rounded hover:bg-gray-700">
//         Маршруты
//       </Link>
//       <Link to="/config" className="px-4 py-2 rounded hover:bg-gray-700">
//         Конфигурация
//       </Link>
//       <Link to="/logs" className="px-4 py-2 rounded hover:bg-gray-700">
//         Логи
//       </Link>
//       <Link to="/statistics" className="px-4 py-2 rounded hover:bg-gray-700">
//         Статистика
//       </Link>
//     </nav>
//   </div>
// );

// const RouteList = ({ routes, onEdit, onToggleStatus, onDelete, onAdd }) => (
//   <div className="bg-gray-800 rounded-lg shadow p-4 text-gray-200">
//     <div className="flex justify-between items-center mb-4">
//       <h2 className="text-xl font-semibold">Список маршрутов</h2>
//       <button
//         onClick={onAdd}
//         className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white"
//       >
//         Добавить маршрут
//       </button>
//     </div>
//     <table className="min-w-full divide-y divide-gray-700">
//       <thead className="bg-gray-700 text-gray-300">
//         <tr>
//           <th className="px-6 py-3 text-left text-xs">Домен</th>
//           <th className="px-6 py-3">Порт</th>
//           <th className="px-6 py-3">Тип</th>
//           <th className="px-6 py-3">Статус</th>
//           <th className="px-6 py-3">Действия</th>
//         </tr>
//       </thead>
//       <tbody className="divide-y divide-gray-700">
//         {routes.map((route) => (
//           <tr key={route.id}>
//             <td className="px-6 py-4">{route.domain}</td>
//             <td className="px-6 py-4">{route.port}</td>
//             <td className="px-6 py-4">
//               {route.proxy_pass ? "Прокси" : "Статика"}
//             </td>
//             <td className="px-6 py-4">
//               <span
//                 className={`px-2 inline-flex text-xs rounded-full ${
//                   route.enabled
//                     ? "bg-green-700 text-green-200"
//                     : "bg-red-700 text-red-200"
//                 }`}
//               >
//                 {route.enabled ? "Активен" : "Отключен"}
//               </span>
//             </td>
//             <td className="px-6 py-4 space-x-2">
//               <button
//                 onClick={() => onToggleStatus(route.id)}
//                 className="text-yellow-400 hover:text-yellow-200"
//               >
//                 {route.enabled ? "Отключить" : "Включить"}
//               </button>
//               <button
//                 onClick={() => onEdit(route)}
//                 className="text-blue-400 hover:text-blue-200"
//               >
//                 Редактировать
//               </button>
//               <button
//                 onClick={() => onDelete(route.id)}
//                 className="text-red-400 hover:text-red-200"
//               >
//                 Удалить
//               </button>
//             </td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   </div>
// );

// const RoutesPage = () => {
//   const [routes, setRoutes] = useState([
//     {
//       id: "1",
//       domain: "example.com",
//       port: 80,
//       root: "/var/www/html",
//       enabled: true,
//       ssl: false,
//       locations: [],
//       advanced: {
//         client_max_body_size: "1m",
//         keepalive_timeout: "65s",
//         gzip: true,
//         gzip_types: "text/plain text/css application/json",
//         caching: true,
//         cache_valid: "200 302 10m",
//       },
//     },
//   ]);

//   const [editing, setEditing] = useState(null);
//   const [activeTab, setActiveTab] = useState("basic");

//   const [locationEditing, setLocationEditing] = useState({
//     index: null,
//     location: null,
//   });

//   const handleSaveRoute = () => {
//     if (!editing) return;
//     if (editing.id) {
//       setRoutes(routes.map((r) => (r.id === editing.id ? editing : r)));
//     } else {
//       setRoutes([...routes, { ...editing, id: Date.now().toString() }]);
//     }
//     setEditing(null);
//   };

//   const handleSaveLocation = (loc) => {
//     if (!editing) return;
//     const updated = { ...editing };
//     if (locationEditing.index !== null) {
//       updated.locations[locationEditing.index] = loc;
//     } else {
//       updated.locations.push(loc);
//     }
//     setEditing(updated);
//     setLocationEditing({ index: null, location: null });
//   };

//   return (
//     <div>
//       <RouteList
//         routes={routes}
//         onEdit={(r) => {
//           setEditing(r);
//           setActiveTab("basic");
//         }}
//         onToggleStatus={(id) =>
//           setRoutes(
//             routes.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
//           )
//         }
//         onDelete={(id) => setRoutes(routes.filter((r) => r.id !== id))}
//         onAdd={() =>
//           setEditing({
//             id: "",
//             domain: "",
//             port: 80,
//             root: "",
//             enabled: true,
//             ssl: false,
//             locations: [],
//             advanced: {
//               client_max_body_size: "1m",
//               keepalive_timeout: "65s",
//               gzip: false,
//               gzip_types: "",
//               caching: false,
//               cache_valid: "",
//             },
//           })
//         }
//       />

//       {editing && (
//         <RouteForm
//           route={editing}
//           isEditing={!!editing.id}
//           activeTab={activeTab}
//           onTabChange={setActiveTab}
//           onCancel={() => setEditing(null)}
//           onSubmit={handleSaveRoute}
//           onFieldChange={(field, value) =>
//             setEditing({ ...editing, [field]: value })
//           }
//           onAdvancedFieldChange={(field, value) =>
//             setEditing({
//               ...editing,
//               advanced: { ...editing.advanced, [field]: value },
//             })
//           }
//           onLocationEdit={(index, loc) =>
//             setLocationEditing({ index, location: loc })
//           }
//           onLocationDelete={(index) =>
//             setEditing({
//               ...editing,
//               locations: editing.locations.filter((_, i) => i !== index),
//             })
//           }
//           onLocationOpenModal={() =>
//             setLocationEditing({
//               index: null,
//               location: { path: "/", try_files: "", index: "" },
//             })
//           }
//           generateConfigPreview={(r) =>
//             `server {
//   listen ${r.port};
//   server_name ${r.domain};
//   root ${r.root};
// }`
//           }
//         />
//       )}

//       {locationEditing.location && (
//         <LocationForm
//           location={locationEditing.location}
//           onFieldChange={(field, value) =>
//             setLocationEditing({
//               ...locationEditing,
//               location: { ...locationEditing.location, [field]: value },
//             })
//           }
//           onCancel={() => setLocationEditing({ index: null, location: null })}
//           onSubmit={handleSaveLocation}
//         />
//       )}
//     </div>
//   );
// };

// const Overview = () => (
//   <div className="text-gray-200">Добро пожаловать в панель Nginx</div>
// );
// const ConfigPage = () => (
//   <div className="text-gray-200">Редактор конфигурации</div>
// );
// const LogsPage = () => <div className="text-gray-200">Просмотр логов</div>;
// const StatisticsPage = () => <div className="text-gray-200">Статистика</div>;

// const App = () => {
//   const [sidebarOpen] = useState(true);

//   return (
//     <Router>
//       <div className="flex h-screen bg-gray-900">
//         <Sidebar isOpen={sidebarOpen} />
//         <div className="flex-1 p-6 overflow-y-auto">
//           <Routes>
//             <Route path="/" element={<Overview />} />
//             <Route path="/routes" element={<RoutesPage />} />
//             <Route path="/config" element={<ConfigPage />} />
//             <Route path="/logs" element={<LogsPage />} />
//             <Route path="/statistics" element={<StatisticsPage />} />
//           </Routes>
//         </div>
//       </div>
//     </Router>
//   );
// };

// export default App;
