import type { ExecutorCommandMap, RemoteExecuteOptions } from "./RemoteExecutor";

export const REMOTE_EXECUTE_CHANNEL = "remote:execute";

export interface RemoteIpcRequest<TMap extends ExecutorCommandMap, TKey extends keyof TMap & string> {
  command: TKey;
  payload: TMap[TKey]["req"];
  options?: RemoteExecuteOptions;
}

export interface RemoteIpcSuccess<TData> {
  ok: true;
  data: TData;
}

export interface RemoteIpcFailure {
  ok: false;
  error: { message: string; code: string; details?: unknown };
}

export type RemoteIpcResult<TData> = RemoteIpcSuccess<TData> | RemoteIpcFailure;
