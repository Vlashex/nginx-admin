import { redactPotentialSecrets } from "@vlashex/core/security/secrets";
import {
  type HostSecrets,
  normalizeHostSecrets,
  SecretsRepositoryError,
  type SecretsRepository,
} from "./SecretsRepository.js";

export interface KeytarLike {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
}

const DEFAULT_SERVICE = "nginx-admin";
const accountForHost = (hostId: string): string => `host:${hostId}`;
const loadKeytar = async (): Promise<KeytarLike> => {
  const module = (await import("keytar")) as KeytarLike | { default?: KeytarLike };
  return "default" in module && module.default ? module.default : (module as KeytarLike);
};

const mapKeytarError = (error: unknown, fallbackMessage: string): SecretsRepositoryError => {
  if (error instanceof SecretsRepositoryError) {
    return error;
  }

  const message = redactPotentialSecrets(error instanceof Error ? error.message : String(error));
  const normalized = message.toLowerCase();
  const code = normalized.includes("denied") || normalized.includes("access")
    ? "ACCESS_DENIED"
    : normalized.includes("secret service") ||
        normalized.includes("credential") ||
        normalized.includes("keychain") ||
        normalized.includes("libsecret")
      ? "CREDENTIAL_MANAGER_UNAVAILABLE"
      : "KEYTAR_UNAVAILABLE";

  return new SecretsRepositoryError(`${fallbackMessage}: ${message}`, code, { cause: error });
};

export class KeytarSecretsRepository implements SecretsRepository {
  constructor(
    private readonly service: string = DEFAULT_SERVICE,
    private readonly store?: KeytarLike
  ) {}

  private async getStore(): Promise<KeytarLike> {
    try {
      return this.store ?? (await loadKeytar());
    } catch (error) {
      throw mapKeytarError(error, "Unable to load keytar");
    }
  }

  async get(hostId: string): Promise<HostSecrets | null> {
    try {
      const store = await this.getStore();
      const raw = await store.getPassword(this.service, accountForHost(hostId));
      if (!raw) {
        return null;
      }

      try {
        return normalizeHostSecrets(JSON.parse(raw));
      } catch (error) {
        throw new SecretsRepositoryError("Stored host credentials are invalid", "CORRUPTED_CREDENTIALS", {
          cause: error,
        });
      }
    } catch (error) {
      throw mapKeytarError(error, "Unable to read host credentials");
    }
  }

  async set(hostId: string, secrets: HostSecrets): Promise<void> {
    const normalized = normalizeHostSecrets(secrets);
    try {
      const store = await this.getStore();
      await store.setPassword(this.service, accountForHost(hostId), JSON.stringify(normalized));
    } catch (error) {
      throw mapKeytarError(error, "Unable to write host credentials");
    }
  }

  async delete(hostId: string): Promise<void> {
    try {
      const store = await this.getStore();
      await store.deletePassword(this.service, accountForHost(hostId));
    } catch (error) {
      throw mapKeytarError(error, "Unable to delete host credentials");
    }
  }
}
