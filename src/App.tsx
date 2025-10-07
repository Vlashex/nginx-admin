import { useState } from "react";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import RoutesPage from "@/pages/routes/RoutesPage";

const isProd = import.meta.env.MODE === "production";
const Router = isProd ? HashRouter : BrowserRouter;

function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className={`bg-gray-900 text-gray-200 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:relative md:translate-x-0 transition duration-200 ease-in-out`}
    >
      <div className="text-white flex items-center space-x-2 px-4 mb-6">
        <span className="text-xl font-bold">Nginx Admin</span>
      </div>
      <nav className="flex flex-col space-y-2">
        <Link to="/" className="px-4 py-2 rounded hover:bg-gray-700">
          Обзор
        </Link>
        <Link to="/routes" className="px-4 py-2 rounded hover:bg-gray-700">
          Маршруты
        </Link>
        <Link to="/config" className="px-4 py-2 rounded hover:bg-gray-700">
          Конфигурация
        </Link>
        <Link to="/logs" className="px-4 py-2 rounded hover:bg-gray-700">
          Логи
        </Link>
        <Link to="/statistics" className="px-4 py-2 rounded hover:bg-gray-700">
          Статистика
        </Link>
      </nav>
    </div>
  );
}

function Overview() {
  return <div className="text-gray-200">Добро пожаловать в панель Nginx</div>;
}

function ConfigPage() {
  return <div className="text-gray-200">Редактор конфигурации</div>;
}

function LogsPage() {
  return <div className="text-gray-200">Просмотр логов</div>;
}

function StatisticsPage() {
  return <div className="text-gray-200">Статистика</div>;
}

export default function App() {
  const [sidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gray-900">
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
