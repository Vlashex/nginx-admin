import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runDesktopSecretsMigration } from "../../../src/main/secrets/migrateDesktopSecrets";
import type { HostSecrets, SecretsRepository } from "../../../src/main/secrets/SecretsRepository";

class MemorySecretsRepository implements SecretsRepository {
  readonly store = new Map<string, HostSecrets>();

  async get(hostId: string): Promise<HostSecrets | null> {
    return this.store.get(hostId) ?? null;
  }

  async set(hostId: string, secrets: HostSecrets): Promise<void> {
    this.store.set(hostId, secrets);
  }

  async delete(hostId: string): Promise<void> {
    this.store.delete(hostId);
  }
}

const SECRET_ENV_KEYS = [
  "SSH_USERNAME",
  "SSH_PASSWORD",
  "SSH_PRIVATE_KEY",
  "SSH_PRIVATE_KEY_PATH",
  "SSH_PASSPHRASE",
] as const;

describe("runDesktopSecretsMigration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of SECRET_ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("migrates env credentials into the secrets repository and cleans the env file", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nginx-admin-secrets-"));
    const privateKeyPath = path.join(dir, "id_rsa");
    const envPath = path.join(dir, ".env");
    fs.writeFileSync(privateKeyPath, "PRIVATE KEY", "utf8");
    fs.writeFileSync(
      envPath,
      [
        "SSH_HOST=10.0.0.10",
        "SSH_USERNAME=admin",
        "SSH_PASSWORD=password",
        `SSH_PRIVATE_KEY_PATH=${privateKeyPath}`,
        "SSH_PASSPHRASE=phrase",
        "NGINX_ADMIN_CLI_PATH=/usr/local/bin/nginx-admin-cli",
      ].join("\n"),
      "utf8"
    );

    process.env.SSH_USERNAME = "admin";
    process.env.SSH_PASSWORD = "password";
    process.env.SSH_PRIVATE_KEY_PATH = privateKeyPath;
    process.env.SSH_PASSPHRASE = "phrase";
    const repository = new MemorySecretsRepository();

    const result = await runDesktopSecretsMigration(repository, envPath, "default");

    expect(result.migrated).toBe(true);
    await expect(repository.get("default")).resolves.toEqual({
      username: "admin",
      password: "password",
      privateKey: "PRIVATE KEY",
      passphrase: "phrase",
    });
    expect(process.env.SSH_PASSWORD).toBeUndefined();
    expect(fs.readFileSync(envPath, "utf8")).toBe(
      ["SSH_HOST=10.0.0.10", "NGINX_ADMIN_CLI_PATH=/usr/local/bin/nginx-admin-cli"].join("\n")
    );
  });

  it("runs only once after a successful migration", async () => {
    process.env.SSH_PASSWORD = "new-password";
    const repository = new MemorySecretsRepository();
    await repository.set("__migration_desktop_env_v1__", { token: "completed" });
    await repository.set("default", { username: "admin", password: "old-password" });

    const result = await runDesktopSecretsMigration(repository, null, "default");

    expect(result.migrated).toBe(false);
    await expect(repository.get("default")).resolves.toEqual({
      username: "admin",
      password: "old-password",
    });
    expect(process.env.SSH_PASSWORD).toBeUndefined();
  });

  it("does not mark migration complete if the repository write fails", async () => {
    process.env.SSH_PASSWORD = "password";
    const repository: SecretsRepository = {
      get: async () => null,
      set: async () => {
        throw new Error("access denied");
      },
      delete: async () => undefined,
    };

    await expect(runDesktopSecretsMigration(repository, null, "default")).rejects.toThrow("access denied");
  });
});
