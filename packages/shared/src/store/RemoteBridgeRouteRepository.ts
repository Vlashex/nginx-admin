import type { RouteRepository } from "@vlashex/core";
import type { Route } from "@vlashex/core";

type RemoteCommand = "routes:list" | "routes:save" | "routes:toggle";

interface RemoteBridgeResult<TData> {
  ok: boolean;
  data?: TData;
  error?: { message: string; code: string };
}

interface RemoteBridgeRequest<TPayload> {
  command: RemoteCommand;
  payload: TPayload;
  options?: { timeoutMs?: number };
}

interface RemoteBridgeApi {
  execute: <TData, TPayload>(request: RemoteBridgeRequest<TPayload>) => Promise<RemoteBridgeResult<TData>>;
}

const resolveRemoteBridge = (): RemoteBridgeApi | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const maybeBridge = (window as unknown as { remoteBridge?: RemoteBridgeApi }).remoteBridge;
  if (!maybeBridge || typeof maybeBridge.execute !== "function") {
    return null;
  }

  return maybeBridge;
};

const toMap = (routes: Route[]): Map<string, Route> => new Map(routes.map((route) => [route.id, route]));

export class RemoteBridgeRouteRepository implements RouteRepository {
  private readonly bridge: RemoteBridgeApi;

  constructor(bridge: RemoteBridgeApi) {
    this.bridge = bridge;
  }

  static isAvailable(): boolean {
    return resolveRemoteBridge() !== null;
  }

  static create(): RemoteBridgeRouteRepository {
    const bridge = resolveRemoteBridge();
    if (!bridge) {
      throw new Error("remoteBridge is unavailable");
    }
    return new RemoteBridgeRouteRepository(bridge);
  }

  async save(route: Route): Promise<void> {
    await this.execute<{ route: Route }, { draft: Route }>("routes:save", { draft: route });
  }

  async findById(id: string): Promise<Route | null> {
    const all = await this.loadAll();
    return all.get(id) ?? null;
  }

  async findAll(): Promise<Route[]> {
    const all = await this.loadAll();
    return Array.from(all.values());
  }

  async delete(id: string): Promise<void> {
    throw new Error(`Delete is not supported over SSH transport for route "${id}"`);
  }

  async saveAll(routes: Map<string, Route>): Promise<void> {
    const tasks = Array.from(routes.values()).map(async (route) => {
      await this.save(route);
    });
    await Promise.all(tasks);
  }

  async loadAll(): Promise<Map<string, Route>> {
    const response = await this.execute<{ routes: Route[] }, { includeDisabled: boolean }>("routes:list", {
      includeDisabled: true,
    });
    return toMap(response.routes);
  }

  private async execute<TData, TPayload>(command: RemoteCommand, payload: TPayload): Promise<TData> {
    const result = await this.bridge.execute<TData, TPayload>({ command, payload });
    if (!result.ok) {
      const message = result.error?.message ?? `Remote command ${command} failed`;
      throw new Error(message);
    }

    if (result.data === undefined) {
      throw new Error(`Remote command ${command} returned empty response`);
    }

    return result.data;
  }
}
