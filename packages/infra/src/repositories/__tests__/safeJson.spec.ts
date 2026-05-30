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

  it("redacts secret-shaped string values before persistence", () => {
    const serialized = stringifyWithoutSecrets({
      proxy_pass: "https://user:pw@example.com",
      header: "Authorization: Bearer abc.def",
      cookieLine: "Cookie: sid=123",
    });

    expect(serialized).toContain("[redacted]");
    expect(serialized).not.toContain("user:pw");
    expect(serialized).not.toContain("abc.def");
    expect(serialized).not.toContain("sid=123");
  });
});
