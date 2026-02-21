import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type {
  BootstrapCheckHostResponse,
  BootstrapContextResponse,
  BootstrapInstallDaemonResponse,
} from "@vlashex/transport/contracts/bootstrap";
import {
  checkBootstrapHost,
  getBootstrapContext,
  installBootstrapDaemon,
} from "../../features/bootstrap/bootstrapBridgeClient";

interface InstallFormValues {
  installScriptUrl: string;
  serviceName: string;
  healthCommand: string;
  timeoutMs: number;
}

const PRESET_VALUES: InstallFormValues = {
  installScriptUrl: "https://repo/install.sh",
  serviceName: "nginx-admin.service",
  healthCommand: "nginx-admin status",
  timeoutMs: 120000,
};

export default function BootstrapPage() {
  const [context, setContext] = useState<BootstrapContextResponse | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<BootstrapCheckHostResponse | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<BootstrapInstallDaemonResponse | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const form = useForm<InstallFormValues>({
    defaultValues: PRESET_VALUES,
  });

  useEffect(() => {
    let active = true;
    void (async () => {
      const result = await getBootstrapContext();
      if (!active) {
        return;
      }

      if (!result.ok) {
        setContextError(result.error.message);
        return;
      }

      setContext(result.data);
      form.reset({
        installScriptUrl: result.data.defaults.installScriptUrl,
        serviceName: result.data.defaults.serviceName,
        healthCommand: result.data.defaults.healthCommand,
        timeoutMs: result.data.defaults.timeoutMs ?? 120000,
      });
    })();

    return () => {
      active = false;
    };
  }, [form]);

  const onCheckHost = async () => {
    setIsChecking(true);
    setCheckError(null);
    setCheckResult(null);
    try {
      const result = await checkBootstrapHost();
      if (!result.ok) {
        setCheckError(result.error.message);
        return;
      }
      setCheckResult(result.data);
    } finally {
      setIsChecking(false);
    }
  };

  const onInstall = form.handleSubmit(async (values) => {
    setIsInstalling(true);
    setInstallError(null);
    setInstallResult(null);
    try {
      const result = await installBootstrapDaemon({
        installScriptUrl: values.installScriptUrl,
        serviceName: values.serviceName,
        healthCommand: values.healthCommand,
        timeoutMs: Number(values.timeoutMs),
      });
      if (!result.ok) {
        setInstallError(result.error.message);
        return;
      }
      setInstallResult(result.data);
    } finally {
      setIsInstalling(false);
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-200">
        <h2 className="text-lg font-semibold">Connection</h2>
        {context && (
          <div className="mt-3 grid gap-2 text-sm text-gray-300">
            <div>Host: {context.connection.host}</div>
            <div>Port: {context.connection.port}</div>
            <div>User: {context.connection.username}</div>
          </div>
        )}
        {!context && <div className="mt-3 text-sm text-gray-400">Loading connection context...</div>}
        {contextError && <div className="mt-3 text-sm text-red-400">{contextError}</div>}
        <button
          type="button"
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
          onClick={onCheckHost}
          disabled={isChecking}
        >
          {isChecking ? "Checking..." : "Check Host Availability"}
        </button>
        {checkResult && (
          <div className="mt-3 text-sm text-green-400">
            Reachable at {checkResult.checkedAt} ({checkResult.latencyMs} ms)
          </div>
        )}
        {checkError && <div className="mt-3 text-sm text-red-400">{checkError}</div>}
      </section>

      <section className="rounded-lg border border-gray-700 bg-gray-800 p-4 text-gray-200">
        <h2 className="text-lg font-semibold">Daemon Initialization</h2>
        <form className="mt-4 grid gap-3" onSubmit={onInstall}>
          <label className="grid gap-1 text-sm">
            Install Script URL
            <input className="rounded border border-gray-600 bg-gray-900 px-3 py-2" {...form.register("installScriptUrl")} />
          </label>
          <label className="grid gap-1 text-sm">
            Systemd Service
            <input className="rounded border border-gray-600 bg-gray-900 px-3 py-2" {...form.register("serviceName")} />
          </label>
          <label className="grid gap-1 text-sm">
            Health Check Command
            <input className="rounded border border-gray-600 bg-gray-900 px-3 py-2" {...form.register("healthCommand")} />
          </label>
          <label className="grid gap-1 text-sm">
            Install Timeout (ms)
            <input
              type="number"
              className="rounded border border-gray-600 bg-gray-900 px-3 py-2"
              {...form.register("timeoutMs", { valueAsNumber: true })}
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            disabled={isInstalling}
          >
            {isInstalling ? "Installing..." : "Install and Verify Daemon"}
          </button>
        </form>

        {installResult && (
          <div className="mt-4 rounded border border-emerald-700 bg-emerald-950/30 p-3 text-sm text-emerald-300">
            <div>Installed at: {installResult.installedAt}</div>
            <div>Service: {installResult.service.name}</div>
            <div>Active: {String(installResult.service.active)} ({installResult.service.activeStateRaw})</div>
            <div>Enabled: {String(installResult.service.enabled)} ({installResult.service.enabledStateRaw})</div>
            <div>Health output: {installResult.health.output || "(empty)"}</div>
          </div>
        )}
        {installError && <div className="mt-4 text-sm text-red-400">{installError}</div>}
      </section>
    </div>
  );
}
