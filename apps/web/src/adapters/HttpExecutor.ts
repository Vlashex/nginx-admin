import type { RouteCommandMap } from "@vlashex/transport/contracts/routeCommands";
import type { RemoteExecuteOptions, RemoteExecutor } from "@vlashex/transport/RemoteExecutor";
import { RemoteExecutionError } from "@vlashex/transport/RemoteExecutor";

interface HttpRemoteResult<TData> {
  ok: boolean;
  data?: TData;
  error?: { message: string; code: string; details?: unknown };
}

export class HttpExecutor implements RemoteExecutor<RouteCommandMap> {
  constructor(private readonly baseUrl: string) {}

  async execute<TKey extends keyof RouteCommandMap & string>(
    command: TKey,
    payload: RouteCommandMap[TKey]["req"],
    options?: RemoteExecuteOptions
  ): Promise<RouteCommandMap[TKey]["res"]> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const onAbort = (): void => {
      controller.abort();
    };

    if (options?.signal?.aborted) {
      throw new RemoteExecutionError("Operation aborted", "ABORTED");
    }

    options?.signal?.addEventListener("abort", onAbort, { once: true });

    if (options?.timeoutMs && options.timeoutMs > 0) {
      timeout = setTimeout(() => {
        controller.abort();
      }, options.timeoutMs);
    }

    try {
      const response = await fetch(`${this.baseUrl}/remote/execute`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ command, payload }),
      });

      if (!response.ok) {
        throw new RemoteExecutionError(`HTTP ${response.status}`, "HTTP_NON_OK");
      }

      const result = (await response.json()) as HttpRemoteResult<RouteCommandMap[TKey]["res"]>;
      if (!result.ok || !result.data) {
        throw new RemoteExecutionError(result.error?.message ?? "Remote API failed", result.error?.code);
      }

      return result.data;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new RemoteExecutionError("Operation aborted", "ABORTED");
      }
      throw error;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
      }
      options?.signal?.removeEventListener("abort", onAbort);
    }
  }
}
