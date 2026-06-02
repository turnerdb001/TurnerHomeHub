"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { MetricRow } from "./gridcn/metric-row";
import { StatusDot } from "./gridcn/status-dot";
import { TronCard } from "./gridcn/tron-card";

type Status = {
  online: boolean;
  last_api_call: string;
  blocked_query_count: number | null;
  dns_status: string;
  error: string | null;
};

export function AdGuardStatus({ token }: { token: string | null }) {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    if (!token) return;
    api<Status>("/adguard/status", { token })
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [token]);

  return (
    <TronCard>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AdGuard Status</h2>
        <StatusDot online={Boolean(status?.online)} />
      </div>
      <div className="mt-4">
        <MetricRow label="Connection" value={status?.online ? "online" : "offline"} />
        <MetricRow label="DNS" value={status?.dns_status || "unknown"} />
        <MetricRow label="Blocked queries" value={status?.blocked_query_count ?? "n/a"} />
      </div>
      {status?.error ? <p className="mt-4 text-sm text-danger">{status.error}</p> : null}
    </TronCard>
  );
}
