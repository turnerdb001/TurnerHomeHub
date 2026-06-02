export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8095";

type RequestOptions = RequestInit & { token?: string | null };

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(detail.detail || response.statusText);
  }
  return response.json();
}

export type Overview = {
  blocked_attempts_today: number;
  failed_pin_attempts_today: number;
  successful_bypasses_today: number;
  active_bypasses: Array<{ id: number; domain: string; client_ip: string | null; expires_at: string; status: string }>;
  recent_logs: Array<{ id: number; timestamp: string; action: string; client_ip: string | null; domain: string | null; result: string }>;
  most_blocked_domains: Array<{ domain: string; count: number }>;
  most_active_devices: Array<{ device: string; count: number }>;
};

export type NotificationSettings = {
  enabled: boolean;
  discord_webhook_url: string;
  repeated_attempt_threshold: number;
  repeated_attempt_window_minutes: number;
  webhook_configured: boolean;
};

export type Profile = {
  id: number;
  display_name: string;
  role: "user" | "child";
  is_active: boolean;
  notes: string | null;
  has_pin: boolean;
};

export type Device = {
  id: number;
  name: string;
  profile_id: number | null;
  ip_address: string | null;
  mac_address: string | null;
  device_type: "phone" | "tablet" | "computer" | "TV" | "console" | "other";
  notes: string | null;
  owner: string | null;
};

export type UniFiSettings = {
  enabled: boolean;
  controller_url: string;
  api_key: string;
  username: string;
  password: string;
  site_id: string;
  verify_ssl: boolean;
  api_key_configured: boolean;
  password_configured: boolean;
};

export type UniFiClient = {
  mac_address: string;
  ip_address: string | null;
  name: string | null;
  hostname: string | null;
  manufacturer: string | null;
  is_wired: boolean;
  network: string | null;
  ssid: string | null;
  blocked: boolean;
  last_seen: number | null;
};
