import type { RouteDraft, RouteId } from "../domain/Route";
import type { RouteGateway } from "../ports/RouteGateway";

export const makeLoadRoutes = (repo: RouteGateway) => (includeDisabled = true) =>
  repo.list({ includeDisabled });

export const makeSaveRoute = (repo: RouteGateway) => (draft: RouteDraft) => repo.save(draft);

export const makeToggleRoute = (repo: RouteGateway) => (id: RouteId, enabled: boolean) =>
  repo.toggle({ id, enabled });
