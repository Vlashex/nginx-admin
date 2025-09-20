// integrations/storeIntegrations.ts
import {
  useServerStore,
  useLogsStore,
  useRoutesStore,
  useRouteFormStore,
} from "@/shared/store/slices";
import { IntegrationService } from "@/core/services/IntegrationService";

// Подписка на изменения статуса сервера для логирования
useServerStore.subscribe((state, prevState) => {
  const logEntry = IntegrationService.handleServerStatusChange(
    state.status,
    prevState.status
  );
  if (logEntry) {
    useLogsStore.getState().addLog(logEntry);
  }
});

// Подписка на изменения маршрутов для синхронизации с формой
useRoutesStore.subscribe((state, prevState) => {
  const route = IntegrationService.handleRouteSelectionChange(
    state.currentRouteId,
    prevState.currentRouteId,
    state.routes
  );

  if (route) {
    useRouteFormStore.getState().setFormData(route);
  } else if (
    state.currentRouteId === null &&
    prevState.currentRouteId !== null
  ) {
    useRouteFormStore.getState().resetForm();
  }
});

// Автосохранение маршрутов при изменении
useRoutesStore.subscribe((state) => {
  if (state.routes.size > 0) {
    setTimeout(() => state.saveRoutes(), 1000);
  }
});
