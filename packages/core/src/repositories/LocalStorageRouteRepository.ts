// core/repositories/LocalStorageRouteRepository.ts
import type { RouteRepository } from "../repositories/RouteRepository";
import type { Route } from "../entities/types";

export class LocalStorageRouteRepository implements RouteRepository {
  private readonly key = "nginx_routes";

  async save(route: Route): Promise<void> {
    const all = await this.loadAll();
    all.set(route.id, route);
    const next = new Map(all);
    await this.saveAll(next);
  }

  async findById(id: string): Promise<Route | null> {
    const all = await this.loadAll();
    return all.get(id) || null;
  }

  async findAll(): Promise<Route[]> {
    const all = await this.loadAll();
    return Array.from(all.values());
  }

  async delete(id: string): Promise<void> {
    const all = await this.loadAll();
    all.delete(id);
    const next = new Map(all);
    await this.saveAll(next);
  }

  async saveAll(routes: Map<string, Route>): Promise<void> {
    localStorage.setItem(
      this.key,
      stringifyWithoutSecrets(Array.from(routes.entries()))
    );
  }

  async loadAll(): Promise<Map<string, Route>> {
    const raw = localStorage.getItem(this.key);
    if (!raw) return new Map();

    try {
      const entries = JSON.parse(raw) as [string, Route][];
      return new Map(entries);
    } catch {
      return new Map();
    }
  }
}

const SENSITIVE_KEY_PATTERN = /(token|secret|password|passphrase|private|auth|credential|key|jwt|session)/iu;
const NON_SECRET_PATH_KEYS = new Set(["ssl_certificate_key", "certificateKey", "certificate_key"]);
const isSensitiveFieldName = (key: string): boolean =>
  SENSITIVE_KEY_PATTERN.test(key) && !NON_SECRET_PATH_KEYS.has(key);

const sanitizeForJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeForJson);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isSensitiveFieldName(key))
      .map(([key, item]) => [key, sanitizeForJson(item)])
  );
};

const stringifyWithoutSecrets = (value: unknown): string => JSON.stringify(sanitizeForJson(value));
