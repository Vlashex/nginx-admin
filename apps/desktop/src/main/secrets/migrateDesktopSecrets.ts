import fs from "node:fs";
import type { HostSecrets, SecretsRepository } from "./SecretsRepository.js";
import { hasHostSecrets, SecretsRepositoryError } from "./SecretsRepository.js";

const MIGRATION_HOST_ID = "default";
const MIGRATION_MARKER_HOST_ID = "__migration_desktop_env_v1__";
const SECRET_ENV_KEYS = new Set([
  "SSH_USERNAME",
  "SSH_PASSWORD",
  "SSH_PRIVATE_KEY",
  "SSH_PRIVATE_KEY_PATH",
  "SSH_PASSPHRASE",
]);

export interface DesktopSecretsMigrationResult {
  hostId: string;
  migrated: boolean;
  cleanedEnvFile: boolean;
  secrets: HostSecrets | null;
}

const getEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.trim() !== "" ? value : undefined;
};

const readPrivateKeyFromEnv = (): string | undefined => {
  const explicitPath = getEnv("SSH_PRIVATE_KEY_PATH");
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) {
      throw new SecretsRepositoryError("SSH private key file was not found", "MIGRATION_FAILED");
    }
    return fs.readFileSync(explicitPath, "utf8");
  }

  const legacyValue = getEnv("SSH_PRIVATE_KEY");
  if (!legacyValue) {
    return undefined;
  }

  if (fs.existsSync(legacyValue)) {
    return fs.readFileSync(legacyValue, "utf8");
  }

  return legacyValue;
};

const collectEnvSecrets = (): HostSecrets => ({
  username: getEnv("SSH_USERNAME"),
  password: getEnv("SSH_PASSWORD"),
  privateKey: readPrivateKeyFromEnv(),
  passphrase: getEnv("SSH_PASSPHRASE"),
});

const clearSecretProcessEnv = (): void => {
  for (const key of SECRET_ENV_KEYS) {
    delete process.env[key];
  }
};

const cleanupEnvFile = (envPath: string | null): boolean => {
  if (!envPath || !fs.existsSync(envPath)) {
    return false;
  }

  const original = fs.readFileSync(envPath, "utf8");
  const nextLines = original.split(/\r?\n/u).filter((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      return true;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      return true;
    }

    const key = line.slice(0, separatorIndex).trim();
    return !SECRET_ENV_KEYS.has(key);
  });
  const next = nextLines.join("\n");

  if (next === original) {
    return false;
  }

  fs.writeFileSync(envPath, next, { encoding: "utf8", mode: 0o600 });
  return true;
};

export const runDesktopSecretsMigration = async (
  repository: SecretsRepository,
  envPath: string | null,
  hostId: string = MIGRATION_HOST_ID
): Promise<DesktopSecretsMigrationResult> => {
  const marker = await repository.get(MIGRATION_MARKER_HOST_ID);
  const existing = await repository.get(hostId);

  if (marker) {
    clearSecretProcessEnv();
    return {
      hostId,
      migrated: false,
      cleanedEnvFile: false,
      secrets: existing,
    };
  }

  const envSecrets = collectEnvSecrets();
  if (!hasHostSecrets(envSecrets)) {
    await repository.set(MIGRATION_MARKER_HOST_ID, { token: "completed" });
    clearSecretProcessEnv();
    return {
      hostId,
      migrated: false,
      cleanedEnvFile: false,
      secrets: existing,
    };
  }

  const merged: HostSecrets = {
    ...existing,
    ...envSecrets,
  };

  await repository.set(hostId, merged);
  const verified = await repository.get(hostId);
  if (!hasHostSecrets(verified)) {
    throw new SecretsRepositoryError("Unable to verify migrated host credentials", "MIGRATION_FAILED");
  }

  const cleanedEnvFile = cleanupEnvFile(envPath);
  clearSecretProcessEnv();
  await repository.set(MIGRATION_MARKER_HOST_ID, { token: "completed" });

  return {
    hostId,
    migrated: true,
    cleanedEnvFile,
    secrets: verified,
  };
};
