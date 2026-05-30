import { describe, expect, it } from "vitest";
import { containsSensitiveFieldName, stringifyWithoutSecrets } from "../safeJson";

describe("safeJson", () => {
  it("removes secret-shaped fields before persistence", () => {
    const serialized = stringifyWithoutSecrets({
      id: "route-1",
      host: "example.com",
      password: "pw",
      nested: {
        accessToken: "token",
        privateKey: "key",
        safe: true,
      },
    });

    expect(serialized).toContain("route-1");
    expect(serialized).toContain("safe");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("accessToken");
    expect(serialized).not.toContain("privateKey");
    expect(containsSensitiveFieldName(serialized)).toBe(false);
  });
});
