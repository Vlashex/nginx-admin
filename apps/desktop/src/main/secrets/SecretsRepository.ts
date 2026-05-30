export interface HostSecrets {
  username?: string;
  password?: string;
  token?: string;
  privateKey?: string;
  passphrase?: string;
}

export interface HostMetadata {
  id: string;
  name: string;
  host: string;
  port: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  checkedAt?: string;
  latencyMs?: number;
  status?: "unknown" | "reachable" | "unreachable";
}

export interface SecretsRepository {
  get(hostId: string): Promise<HostSecrets | null>;
  set(hostId: string, secrets: HostSecrets): Promise<void>;
  delete(hostId: string): Promise<void>;
}

export type SecretsRepositoryErrorCode =
  | "KEYTAR_UNAVAILABLE"
  | "CORRUPTED_CREDENTIALS"
  | "INVALID_SECRET_FORMAT"
  | "ACCESS_DENIED"
  | "CREDENTIAL_MANAGER_UNAVAILABLE"
  | "MIGRATION_FAILED";

export class SecretsRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: SecretsRepositoryErrorCode,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = "SecretsRepositoryError";
  }
}

const HOST_SECRET_KEYS = ["username", "password", "token", "privateKey", "passphrase"] as const;

export const normalizeHostSecrets = (value: unknown): HostSecrets => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new SecretsRepositoryError("Stored host secret payload is not an object", "INVALID_SECRET_FORMAT");
  }

  const source = value as Record<string, unknown>;
  const result: HostSecrets = {};
  for (const key of HOST_SECRET_KEYS) {
    const item = source[key];
    if (item === undefined || item === null || item === "") {
      continue;
    }
    if (typeof item !== "string") {
      throw new SecretsRepositoryError(`Stored host secret field is invalid: ${key}`, "INVALID_SECRET_FORMAT");
    }
    result[key] = item;
  }

  return result;
};

export const hasHostSecrets = (secrets: HostSecrets | null | undefined): secrets is HostSecrets =>
  Boolean(
    secrets &&
      (secrets.username || secrets.password || secrets.token || secrets.privateKey || secrets.passphrase)
  );
