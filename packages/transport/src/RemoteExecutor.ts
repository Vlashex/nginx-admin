export type ExecutorCommandMap = Record<string, { req: unknown; res: unknown }>;

export interface RemoteExecuteOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class RemoteExecutionError extends Error {
  public readonly code: string;
  public readonly causeData?: unknown;

  constructor(message: string, code = "REMOTE_EXECUTION_FAILED", causeData?: unknown) {
    super(message);
    this.name = "RemoteExecutionError";
    this.code = code;
    this.causeData = causeData;
  }
}

export interface RemoteExecutor<TMap extends ExecutorCommandMap> {
  execute<TKey extends keyof TMap & string>(
    command: TKey,
    payload: TMap[TKey]["req"],
    options?: RemoteExecuteOptions
  ): Promise<TMap[TKey]["res"]>;
}
