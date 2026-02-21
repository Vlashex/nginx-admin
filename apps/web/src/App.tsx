import { useState } from "react";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import RoutesPage from "./pages/routes/RoutesPage";
import BootstrapPage from "./pages/bootstrap/BootstrapPage";
import { Toaster } from "sonner";

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
          Overview
        </Link>
        <Link to="/routes" className="px-4 py-2 rounded hover:bg-gray-700">
          Routes
        </Link>
        <Link to="/config" className="px-4 py-2 rounded hover:bg-gray-700">
          Config
        </Link>
        <Link to="/logs" className="px-4 py-2 rounded hover:bg-gray-700">
          Logs
        </Link>
        <Link to="/statistics" className="px-4 py-2 rounded hover:bg-gray-700">
          Statistics
        </Link>
        <Link to="/bootstrap" className="px-4 py-2 rounded hover:bg-gray-700">
          Bootstrap
        </Link>
      </nav>
    </div>
  );
}

function Overview() {
  return <div className="text-gray-200">Welcome to Nginx Admin dashboard</div>;
}

function ConfigPage() {
  return <div className="text-gray-200">Configuration editor</div>;
}

function LogsPage() {
  return <div className="text-gray-200">Logs view</div>;
}

function StatisticsPage() {
  return <div className="text-gray-200">Statistics</div>;
}

export default function App() {
  const [sidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gray-900">
        <Toaster position="top-right" richColors />
        <Sidebar isOpen={sidebarOpen} />
        <div className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/bootstrap" element={<BootstrapPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
