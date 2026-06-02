"use client";

import { Bell, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, NotificationSettings as NotificationSettingsType } from "@/lib/api";
import { TronCard } from "./gridcn/tron-card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const defaultSettings: NotificationSettingsType = {
  enabled: true,
  discord_webhook_url: "",
  repeated_attempt_threshold: 3,
  repeated_attempt_window_minutes: 10,
  webhook_configured: false,
};

export function NotificationSettings({ token }: { token: string | null }) {
  const [settings, setSettings] = useState<NotificationSettingsType>(defaultSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    api<NotificationSettingsType>("/admin/settings/notifications", { token })
      .then(setSettings)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load notification settings"));
  }, [token]);

  async function save() {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await api<NotificationSettingsType>("/admin/settings/notifications", {
        method: "PUT",
        token,
        body: JSON.stringify(settings),
      });
      setSettings(updated);
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save notification settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <TronCard id="settings">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary">Settings</p>
          <h2 className="mt-2 text-lg font-semibold">Discord Notifications</h2>
        </div>
        <Bell className="h-5 w-5 text-primary" />
      </div>

      <label className="flex items-center justify-between gap-4 rounded-md border border-primary/20 bg-background/45 px-3 py-3">
        <span>
          <span className="block text-sm font-medium">Send Discord notifications</span>
          <span className="block text-xs text-muted">Blocked visits, failed PINs, bypasses, and AdGuard failures.</span>
        </span>
        <input
          type="checkbox"
          className="h-5 w-5 accent-cyan-400"
          checked={settings.enabled}
          onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
        />
      </label>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-2 block text-sm text-muted">Discord webhook URL</span>
          <Input
            type="password"
            value={settings.discord_webhook_url}
            placeholder="https://discord.com/api/webhooks/..."
            onChange={(event) => setSettings((current) => ({ ...current, discord_webhook_url: event.target.value }))}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-muted">Repeated attempt threshold</span>
            <Input
              type="number"
              min={1}
              max={100}
              value={settings.repeated_attempt_threshold}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  repeated_attempt_threshold: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm text-muted">Window minutes</span>
            <Input
              type="number"
              min={1}
              max={1440}
              value={settings.repeated_attempt_window_minutes}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  repeated_attempt_window_minutes: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted">
          {settings.webhook_configured ? "webhook configured" : "webhook not configured"}
        </span>
        <Button onClick={save} disabled={saving || !token}>
          <Save className="h-4 w-4" />
          Save notifications
        </Button>
      </div>
    </TronCard>
  );
}
