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

export const stringifyWithoutSecrets = (value: unknown): string => JSON.stringify(sanitizeForJson(value));

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
