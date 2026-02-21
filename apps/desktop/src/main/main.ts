import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { registerBootstrapHandlers } from "./ipc/registerBootstrapHandlers.js";
import { SSHExecutor } from "./ssh/SSHExecutor.js";

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 900;
const SSH_LOG_PREFIX = "[main][ssh]";
const ENV_LOG_PREFIX = "[main][env]";

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

const loadDesktopEnv = (): void => {
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
    return;
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
};

const resolvePrivateKeyConfig = (): { privateKey: string | Buffer | undefined; source: string } => {
  const explicitPath = process.env.SSH_PRIVATE_KEY_PATH;
  if (explicitPath) {
    if (!fs.existsSync(explicitPath)) {
      throw new Error(`SSH private key file was not found: ${explicitPath}`);
    }
    return { privateKey: fs.readFileSync(explicitPath), source: `file:${explicitPath}` };
  }

  const legacyValue = process.env.SSH_PRIVATE_KEY;
  if (!legacyValue) {
    return { privateKey: undefined, source: "none" };
  }

  if (fs.existsSync(legacyValue)) {
    return { privateKey: fs.readFileSync(legacyValue), source: `file:${legacyValue}` };
  }

  return { privateKey: legacyValue, source: "inline" };
};

const createSshExecutor = (): SSHExecutor => {
  const host = process.env.SSH_HOST ?? "127.0.0.1";
  const username = process.env.SSH_USERNAME ?? process.env.USER ?? process.env.USERNAME ?? "";
  if (!username) {
    throw new Error("SSH username is required. Set SSH_USERNAME.");
  }
  const port = parsePort(process.env.SSH_PORT, 22);
  const { privateKey, source: privateKeySource } = resolvePrivateKeyConfig();
  const usesPassword = Boolean(process.env.SSH_PASSWORD);
  const usesPrivateKey = Boolean(privateKey);

  console.info(`${SSH_LOG_PREFIX} SSH executor init`, {
    host,
    port,
    username,
    privateKeySource,
    usesPassword,
    usesPrivateKey,
    cliPath: process.env.NGINX_ADMIN_CLI_PATH ?? "/usr/local/bin/nginx-admin-cli",
  });

  if (!usesPassword && !usesPrivateKey) {
    console.warn(`${SSH_LOG_PREFIX} Neither SSH password nor private key is configured.`);
  }

  return new SSHExecutor(
    {
      host,
      username,
      port,
      password: process.env.SSH_PASSWORD,
      privateKey,
      passphrase: process.env.SSH_PASSPHRASE,
      cliPath: process.env.NGINX_ADMIN_CLI_PATH ?? "/usr/local/bin/nginx-admin-cli",
    },
    {
      keepaliveInterval: 15_000,
      keepaliveCountMax: 3,
      maxRetries: 1,
      retryBaseDelayMs: 250,
    }
  );
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
loadDesktopEnv();
const sshExecutor = createSshExecutor();

app.whenReady().then(async () => {
  registerBootstrapHandlers(sshExecutor);
  mainWindow = await createWindow();
  mainWindow.webContents.openDevTools();

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
  void sshExecutor.shutdown();
});
