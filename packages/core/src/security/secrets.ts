const SENSITIVE_KEY_PATTERN =
  /(access[-_]?token|refresh[-_]?token|api[-_]?key|authorization|cookie|token|secret|password|passphrase|private(?:key)?|auth|credential|jwt|session|bearer)/iu;

const NON_SECRET_PATH_KEYS = new Set([
  "ssl_certificate_key",
  "certificateKey",
  "certificate_key",
]);

const SECRET_VALUE_PATTERNS = [
  /\b(authorization)\s*[:=]\s*(bearer\s+)?("[^"]*"|'[^']*'|[^\s,;]+)/giu,
  /\b(cookie|set-cookie)\s*[:=]\s*("[^"]*"|'[^']*'|[^\r\n]+)/giu,
  /\b(access[-_]?token|refresh[-_]?token|api[-_]?key|token|secret|password|passphrase|private(?:key)?|auth|credential|jwt|session)\b\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;]+)/giu,
  /\bbearer\s+[a-z0-9._~+/=-]+/giu,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gu,
];

const URL_WITH_CREDENTIALS_PATTERN = /\b([a-z][a-z0-9+.-]*:\/\/)([^/?#\s@]+@)/giu;

export const isSensitiveFieldName = (key: string): boolean =>
  SENSITIVE_KEY_PATTERN.test(key) && !NON_SECRET_PATH_KEYS.has(key);

export const redactPotentialSecrets = (value: string): string => {
  let next = value.replace(URL_WITH_CREDENTIALS_PATTERN, "$1[redacted]@");
  for (const pattern of SECRET_VALUE_PATTERNS) {
    next = next.replace(pattern, (match: string, key?: string) => {
      if (!key) {
        return "[redacted]";
      }
      return `${key}=[redacted]`;
    });
  }
  return next;
};

export const containsSecretLikeValue = (value: string): boolean =>
  redactPotentialSecrets(value) !== value;

export const containsSensitiveDirective = (value: string): boolean => {
  const normalized = value.toLowerCase();
  return (
    normalized.includes("authorization") ||
    normalized.includes("cookie") ||
    normalized.includes("proxy_set_header auth") ||
    normalized.includes("password") ||
    normalized.includes("token") ||
    normalized.includes("secret") ||
    normalized.includes("credential") ||
    normalized.includes("jwt") ||
    normalized.includes("session") ||
    normalized.includes("bearer")
  );
};

export const sanitizeForJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeForJson);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    return redactPotentialSecrets(value);
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

export const stringifyWithoutSecrets = (value: unknown): string =>
  JSON.stringify(sanitizeForJson(value));

const hasSensitiveFieldName = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.some(hasSensitiveFieldName);
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).some(
    ([key, item]) => isSensitiveFieldName(key) || hasSensitiveFieldName(item)
  );
};

export const containsSensitiveFieldName = (serialized: string): boolean =>
  hasSensitiveFieldName(JSON.parse(serialized));
