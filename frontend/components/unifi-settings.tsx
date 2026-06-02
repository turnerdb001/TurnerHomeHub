"use client";

import { Download, PlugZap, Radar, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, UniFiClient, UniFiSettings as UniFiSettingsType } from "@/lib/api";
import { TronCard } from "./gridcn/tron-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const defaults: UniFiSettingsType = {
  enabled: false,
  controller_url: "",
  api_key: "",
  username: "",
  password: "",
  site_id: "default",
  verify_ssl: false,
  api_key_configured: false,
  password_configured: false,
};

export function UniFiSettings({ token, onSynced }: { token: string | null; onSynced?: () => void }) {
  const [settings, setSettings] = useState<UniFiSettingsType>(defaults);
  const [clients, setClients] = useState<UniFiClient[]>([]);
  const [status, setStatus] = useState<string>("not tested");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<UniFiSettingsType>("/admin/settings/unifi", { token })
      .then(setSettings)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load UniFi settings"));
  }, [token]);

  async function save() {
    if (!token) return;
    setBusy(true);
    try {
      const updated = await api<UniFiSettingsType>("/admin/settings/unifi", {
        method: "PUT",
        token,
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      toast.success("UniFi settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save UniFi settings");
    } finally {
      setBusy(false);
    }
  }

  async function testConnection() {
    if (!token) return;
    setBusy(true);
    try {
      const result = await api<{ online: boolean; client_count: number; error: string | null }>("/admin/unifi/status", { token });
      setStatus(result.online ? `online, ${result.client_count} clients visible` : result.error || "offline");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "offline");
    } finally {
      setBusy(false);
    }
  }

  async function loadClients() {
    if (!token) return;
    setBusy(true);
    try {
      setClients(await api<UniFiClient[]>("/admin/unifi/clients", { token }));
      toast.success("UniFi clients loaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load UniFi clients");
    } finally {
      setBusy(false);
    }
  }

  async function syncDevices() {
    if (!token) return;
    setBusy(true);
    try {
      const result = await api<{ imported: number; updated: number; skipped: number; clients: UniFiClient[] }>(
        "/admin/unifi/sync-devices",
        { method: "POST", token },
      );
      setClients(result.clients);
      onSynced?.();
      toast.success(`UniFi sync complete: ${result.imported} imported, ${result.updated} updated`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sync UniFi devices");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TronCard id="unifi">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Integration</p>
          <h2 className="mt-2 text-lg font-semibold">UniFi Device Discovery</h2>
        </div>
        <Radar className="h-5 w-5 text-primary" />
      </div>

      <label className="mb-4 flex items-center justify-between gap-4 rounded-md border border-primary/20 bg-background/45 px-3 py-3">
        <span>
          <span className="block text-sm font-medium">Enable UniFi integration</span>
          <span className="block text-xs text-muted">Use UniFi OS clients to populate Home Hub devices by MAC and IP.</span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-cyan-400"
          checked={settings.enabled}
          onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
        />
      </label>

      <div className="grid gap-3 lg:grid-cols-2">
        <Input
          placeholder="https://192.168.1.1"
          value={settings.controller_url}
          onChange={(event) => setSettings((current) => ({ ...current, controller_url: event.target.value }))}
        />
        <Input
          placeholder="Site ID, usually default"
          value={settings.site_id}
          onChange={(event) => setSettings((current) => ({ ...current, site_id: event.target.value }))}
        />
        <Input
          type="password"
          placeholder="UniFi API key"
          value={settings.api_key}
          onChange={(event) => setSettings((current) => ({ ...current, api_key: event.target.value }))}
        />
        <Input
          placeholder="Username fallback"
          value={settings.username}
          onChange={(event) => setSettings((current) => ({ ...current, username: event.target.value }))}
        />
        <Input
          type="password"
          placeholder="Password fallback"
          value={settings.password}
          onChange={(event) => setSettings((current) => ({ ...current, password: event.target.value }))}
        />
        <label className="flex min-h-11 items-center justify-between rounded-md border border-primary/30 bg-background/70 px-3 text-sm">
          Verify SSL
          <input
            type="checkbox"
            className="h-5 w-5 accent-cyan-400"
            checked={settings.verify_ssl}
            onChange={(event) => setSettings((current) => ({ ...current, verify_ssl: event.target.checked }))}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={save} disabled={busy || !token}>
          <Save className="h-4 w-4" />
          Save UniFi
        </Button>
        <Button onClick={testConnection} disabled={busy || !token}>
          <PlugZap className="h-4 w-4" />
          Test
        </Button>
        <Button onClick={loadClients} disabled={busy || !token}>
          <Radar className="h-4 w-4" />
          Discover
        </Button>
        <Button onClick={syncDevices} disabled={busy || !token}>
          <Download className="h-4 w-4" />
          Sync devices
        </Button>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-background/45 px-3 py-2 font-mono text-xs text-muted">
        Status: {status}
      </div>

      {clients.length ? (
        <div className="mt-5 max-h-80 overflow-auto rounded-md border border-primary/20">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-primary/10 text-xs uppercase text-primary">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">IP</th>
                <th className="px-3 py-2">MAC</th>
                <th className="px-3 py-2">Network</th>
                <th className="px-3 py-2">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {clients.slice(0, 50).map((client) => (
                <tr key={client.mac_address}>
                  <td className="px-3 py-2">{client.name || client.hostname || "unknown"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{client.ip_address || "n/a"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{client.mac_address}</td>
                  <td className="px-3 py-2">{client.network || client.ssid || "unknown"}</td>
                  <td className="px-3 py-2">{client.is_wired ? "wired" : "wireless"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </TronCard>
  );
}
