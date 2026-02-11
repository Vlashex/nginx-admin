import { app, BrowserWindow } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerRemoteHandlers } from "./ipc/registerRemoteHandlers.js";
import { SSHExecutor } from "./ssh/SSHExecutor.js";

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 900;

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

const createSshExecutor = (): SSHExecutor => {
  const host = process.env.SSH_HOST ?? "127.0.0.1";
  const username = process.env.SSH_USERNAME ?? process.env.USER ?? process.env.USERNAME ?? "";
  if (!username) {
    throw new Error("SSH username is required. Set SSH_USERNAME.");
  }

  return new SSHExecutor(
    {
      host,
      username,
      port: parsePort(process.env.SSH_PORT, 22),
      password: process.env.SSH_PASSWORD,
      privateKey: process.env.SSH_PRIVATE_KEY,
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
  console.log(app.getAppPath(), indexPath)
  await win.loadFile(indexPath);
  return win;
};

let mainWindow: BrowserWindow | null = null;
const sshExecutor = createSshExecutor();

app.whenReady().then(async () => {
  registerRemoteHandlers(sshExecutor);
  mainWindow = await createWindow();
  mainWindow.webContents.openDevTools();


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
