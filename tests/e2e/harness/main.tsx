import { createRoot } from "react-dom/client";
import {
  useServerStore,
  useLogsStore,
  useRoutesStore,
  useRouteFormStore,
} from "@/shared/store/slices";
import "@/processes/integrations/storeIntegrations";
import { generateConfigPreview } from "@/core/services/ConfigGenerator";

// Expose core API early at module scope so it's available before React renders
// @ts-expect-error test harness global
window.__core__ = { generateConfigPreview };

function App() {
  const server = useServerStore();
  const logs = useLogsStore();
  const routes = useRoutesStore();
  const form = useRouteFormStore();

  // expose to window for Playwright to drive state via public actions
  // @ts-expect-error test harness global
  window.__stores__ = { server, logs, routes, form };

  return (
    <div>
      <h1>Harness</h1>
      <div id="server-status">{server.status}</div>
      <div id="logs-count">{logs.logs.length}</div>
      <div id="current-route">{routes.currentRouteId ?? "null"}</div>
      <div id="form-domain">{form.formData.domain as string}</div>
    </div>
  );
}

const container = document.getElementById("app")!;
createRoot(container).render(<App />);
