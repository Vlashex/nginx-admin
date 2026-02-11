export type RouteId = string;

export interface Route {
  id: RouteId;
  host: string;
  destination: string;
  enabled: boolean;
  updatedAt: string;
}

export interface RouteDraft {
  id?: RouteId;
  host: string;
  destination: string;
  enabled?: boolean;
}
