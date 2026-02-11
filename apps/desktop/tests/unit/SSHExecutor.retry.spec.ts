import { describe, it } from "vitest";

describe("SSHExecutor retry behavior", () => {
  it.todo("retries only on SSH_CONNECT_FAILED and succeeds on a later attempt");

  it.todo("uses exponential backoff based on retryBaseDelayMs");

  it.todo("does not retry for non-connection errors");
});
