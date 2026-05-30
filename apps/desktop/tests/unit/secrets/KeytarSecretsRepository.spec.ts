import { describe, expect, it } from "vitest";
import { KeytarSecretsRepository, type KeytarLike } from "../../../src/main/secrets/KeytarSecretsRepository";
import { SecretsRepositoryError } from "../../../src/main/secrets/SecretsRepository";

class MemoryKeytar implements KeytarLike {
  readonly store = new Map<string, string>();

  async getPassword(service: string, account: string): Promise<string | null> {
    return this.store.get(`${service}:${account}`) ?? null;
  }

  async setPassword(service: string, account: string, password: string): Promise<void> {
    this.store.set(`${service}:${account}`, password);
  }

  async deletePassword(service: string, account: string): Promise<boolean> {
    return this.store.delete(`${service}:${account}`);
  }
}

describe("KeytarSecretsRepository", () => {
  it("saves and reads host secrets", async () => {
    const keytar = new MemoryKeytar();
    const repository = new KeytarSecretsRepository("test", keytar);

    await repository.set("host-1", {
      username: "admin",
      password: "pw",
      token: "token",
      privateKey: "key",
      passphrase: "phrase",
    });

    await expect(repository.get("host-1")).resolves.toEqual({
      username: "admin",
      password: "pw",
      token: "token",
      privateKey: "key",
      passphrase: "phrase",
    });
  });

  it("updates host secrets", async () => {
    const repository = new KeytarSecretsRepository("test", new MemoryKeytar());

    await repository.set("host-1", { username: "admin", password: "old" });
    await repository.set("host-1", { username: "admin", password: "new" });

    await expect(repository.get("host-1")).resolves.toEqual({
      username: "admin",
      password: "new",
    });
  });

  it("deletes host secrets", async () => {
    const repository = new KeytarSecretsRepository("test", new MemoryKeytar());

    await repository.set("host-1", { username: "admin", password: "pw" });
    await repository.delete("host-1");

    await expect(repository.get("host-1")).resolves.toBeNull();
  });

  it("reports corrupted credentials", async () => {
    const keytar = new MemoryKeytar();
    keytar.store.set("test:host:host-1", "{bad-json");
    const repository = new KeytarSecretsRepository("test", keytar);

    await expect(repository.get("host-1")).rejects.toMatchObject({
      code: "CORRUPTED_CREDENTIALS",
    } satisfies Partial<SecretsRepositoryError>);
  });

  it("maps keytar failures to repository errors", async () => {
    const keytar: KeytarLike = {
      getPassword: async () => {
        throw new Error("Credential manager unavailable");
      },
      setPassword: async () => undefined,
      deletePassword: async () => true,
    };
    const repository = new KeytarSecretsRepository("test", keytar);

    await expect(repository.get("host-1")).rejects.toMatchObject({
      code: "CREDENTIAL_MANAGER_UNAVAILABLE",
    } satisfies Partial<SecretsRepositoryError>);
  });
});
