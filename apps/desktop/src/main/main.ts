import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { registerBootstrapHandlers } from "./ipc/registerBootstrapHandlers.js";
import { KeytarSecretsRepository } from "./secrets/KeytarSecretsRepository.js";
import { type HostMetadata, type HostSecrets, SecretsRepositoryError } from "./secrets/SecretsRepository.js";
import { runDesktopSecretsMigration } from "./secrets/migrateDesktopSecrets.js";
import { SSHExecutor } from "./ssh/SSHExecutor.js";

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 900;
const SSH_LOG_PREFIX = "[main][ssh]";
const ENV_LOG_PREFIX = "[main][env]";
const SECRET_ENV_KEYS = [
  "SSH_USERNAME",
  "SSH_PASSWORD",
  "SSH_PRIVATE_KEY",
  "SSH_PRIVATE_KEY_PATH",
  "SSH_PASSPHRASE",
] as const;

const resolveExistingPath = (candidates: string[]): string => {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Unable to resolve required file path. Checked: ${candidates.join(", ")}`);
};

const parsePort = (raw: string | undefined, fallback: number): number => {
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid SSH_PORT value: ${raw}`);
  }
  return parsed;
};

const parseEnvValue = (rawValue: string): string => {
  const value = rawValue.trim();
  if (!value) {
    return "";
  }

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

const clearSecretProcessEnv = (): void => {
  for (const key of SECRET_ENV_KEYS) {
    delete process.env[key];
  }
};

const loadDesktopEnv = (): string | null => {
  const candidates = Array.from(
    new Set([
      process.env.DESKTOP_ENV_PATH,
      path.resolve(process.cwd(), ".env"),
      path.resolve(__dirname, "../../.env"),
      path.resolve(app.getAppPath(), ".env"),
      path.resolve(app.getAppPath(), "apps/desktop/.env"),
    ].filter((candidate): candidate is string => Boolean(candidate)))
  );

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) {
    console.warn(`${ENV_LOG_PREFIX} .env file not found`, { checked: candidates });
    return null;
  }

  const content = fs.readFileSync(envPath, "utf8");
  let applied = 0;
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    const value = parseEnvValue(line.slice(separatorIndex + 1));
    process.env[key] = value;
    applied += 1;
  }

  console.info(`${ENV_LOG_PREFIX} Loaded .env`, {
    envPath,
    applied,
  });
  return envPath;
};

interface SshRuntime {
  executor: SSHExecutor;
  hasAuth: boolean;
  metadata: HostMetadata;
}

const createSshRuntime = async (secretsRepository: KeytarSecretsRepository, envPath: string | null): Promise<SshRuntime> => {
  const host = process.env.SSH_HOST ?? "127.0.0.1";
  const port = parsePort(process.env.SSH_PORT, 22);
  let secrets: HostSecrets | null = null;
  try {
    const migration = await runDesktopSecretsMigration(secretsRepository, envPath, "default");
    secrets = migration.secrets;
    if (migration.migrated) {
      console.info(`${SSH_LOG_PREFIX} Migrated SSH credentials to secure storage`, {
        hostId: migration.hostId,
        cleanedEnvFile: migration.cleanedEnvFile,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof SecretsRepositoryError ? error.code : "MIGRATION_FAILED";
    console.error(`${SSH_LOG_PREFIX} Secure credential migration failed`, { code, message });
    clearSecretProcessEnv();
  }

  const username = secrets?.username ?? process.env.USER ?? process.env.USERNAME ?? "unknown";
  const privateKey = secrets?.privateKey;
  const usesPassword = Boolean(secrets?.password);
  const usesPrivateKey = Boolean(privateKey);
  const metadata: HostMetadata = {
    id: "default",
    name: process.env.SSH_HOST_NAME ?? host,
    host,
    port,
    description: process.env.SSH_HOST_DESCRIPTION,
    status: "unknown",
  };

  console.info(`${SSH_LOG_PREFIX} SSH executor init`, {
    hostId: metadata.id,
    host: metadata.host,
    port: metadata.port,
    usesPassword,
    usesPrivateKey,
    cliPath: process.env.NGINX_ADMIN_CLI_PATH ?? "/usr/local/bin/nginx-admin-cli",
  });

  if (!usesPassword && !usesPrivateKey) {
    console.warn(`${SSH_LOG_PREFIX} Neither SSH password nor private key is configured.`);
  }

  return {
    executor: new SSHExecutor(
      {
        host,
        username,
        port,
        password: secrets?.password,
        privateKey,
        passphrase: secrets?.passphrase,
        cliPath: process.env.NGINX_ADMIN_CLI_PATH ?? "/usr/local/bin/nginx-admin-cli",
      },
      {
        keepaliveInterval: 15_000,
        keepaliveCountMax: 3,
        maxRetries: 1,
        retryBaseDelayMs: 250,
      }
    ),
    hasAuth: usesPassword || usesPrivateKey,
    metadata,
  };
};

const createWindow = async (): Promise<BrowserWindow> => {
  const currentFileDir = __dirname;
  const preloadPath = resolveExistingPath([
    path.resolve(currentFileDir, "../preload/remoteBridge.js"),
    path.resolve(app.getAppPath(), "dist/preload/remoteBridge.js"),
  ]);

  const win = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  const devServerUrl = process.env.ELECTRON_RENDERER_URL;
  if (devServerUrl) {
    await win.loadURL(devServerUrl);
    return win;
  }

  const indexPath = resolveExistingPath([
    path.resolve(app.getAppPath(), "../web/dist/index.html"),
    path.resolve(app.getAppPath(), "apps/web/dist/index.html"),
  ]);
  await win.loadFile(indexPath);
  return win;
};

let mainWindow: BrowserWindow | null = null;
const envPath = loadDesktopEnv();
const secretsRepository = new KeytarSecretsRepository();
let sshRuntime: SshRuntime | null = null;

app.whenReady().then(async () => {
  sshRuntime = await createSshRuntime(secretsRepository, envPath);
  const sshExecutor = sshRuntime.executor;
  registerBootstrapHandlers(sshExecutor, sshRuntime.metadata);
  mainWindow = await createWindow();
  if (!app.isPackaged && process.env.ELECTRON_OPEN_DEVTOOLS === "1") {
    mainWindow.webContents.openDevTools();
  }

  if (!sshRuntime.hasAuth) {
    console.warn(`${SSH_LOG_PREFIX} Startup SSH health check skipped: no SSH auth configured`);
    return;
  }

  try {
    await sshExecutor.checkConnection({ timeoutMs: 7_000 });
    console.info(`${SSH_LOG_PREFIX} Startup SSH health check passed`);
  } catch (error) {
    console.error(`${SSH_LOG_PREFIX} Startup SSH health check failed`, error);
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  void sshRuntime?.executor.shutdown();
});
