// core/utils/validators.ts
import type { Domain, Port, UnixPath, URLPath } from "@/core/entities/types";

export const validateDomain = (domain: string): domain is Domain =>
  /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);

export const validatePort = (port: number): port is Port =>
  Number.isInteger(port) && port > 0 && port <= 65535;

export const validateUnixPath = (path: string): path is UnixPath =>
  /^(\/[a-zA-Z0-9_.-]+)+$/.test(path);

export const validateURLPath = (path: string): path is URLPath =>
  /^\/[a-zA-Z0-9_./-]*$/.test(path);
