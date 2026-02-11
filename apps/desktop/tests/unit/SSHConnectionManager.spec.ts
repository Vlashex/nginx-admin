import { describe, expect, it } from "vitest";
import { SSHConnectionManager } from "../../src/main/ssh/SSHConnectionManager";

describe("SSHConnectionManager", () => {
  it.todo("reuses the same ready ssh2 client across multiple execute calls");

  it.todo("applies keepalive defaults when missing from config");

  it("exposes shutdown() for graceful connection close", async () => {
    const manager = new SSHConnectionManager({ host: "127.0.0.1", username: "test" });
    await expect(manager.shutdown()).resolves.toBeUndefined();
  });
});
