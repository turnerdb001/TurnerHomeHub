"use client";

import { Activity, Bell, CalendarClock, Library, Lock, LucideIcon, Network, ShieldAlert, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ActivityFeed } from "@/components/activity-feed";
import { AdGuardStatus } from "@/components/adguard-status";
import { MetricRow } from "@/components/gridcn/metric-row";
import { SidebarNav } from "@/components/gridcn/sidebar-nav";
import { StatCard } from "@/components/gridcn/stat-card";
import { TronCard } from "@/components/gridcn/tron-card";
import { HouseholdManager } from "@/components/household-manager";
import { NotificationSettings } from "@/components/notification-settings";
import { UniFiSettings } from "@/components/unifi-settings";
import { Button } from "@/components/ui/button";
import { api, Overview } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  async function refreshOverview(currentToken = token) {
    if (!currentToken) return;
    setOverview(await api<Overview>("/admin/overview", { token: currentToken }));
  }

  useEffect(() => {
    const stored = localStorage.getItem("turner_token");
    if (!stored) {
      router.push("/login");
      return;
    }
    setToken(stored);
    refreshOverview(stored)
      .catch(() => router.push("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <main className="min-h-screen grid-surface lg:flex">
      <SidebarNav />
      <section className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Family command center</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Turner Home Hub</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/block?domain=example.com">
              <Button>Preview Block</Button>
            </Link>
            <Button
              onClick={() => {
                localStorage.removeItem("turner_token");
                router.push("/login");
              }}
            >
              Logout
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Blocked Today"
            value={overview?.blocked_attempts_today ?? "-"}
            detail="Block page visits logged since midnight"
            icon={ShieldAlert}
          />
          <StatCard
            label="PIN Failures"
            value={overview?.failed_pin_attempts_today ?? "-"}
            detail="Failed or invalid User PIN attempts"
            icon={Lock}
          />
          <StatCard
            label="Bypasses"
            value={overview?.successful_bypasses_today ?? "-"}
            detail="Temporary AdGuard allow rules created today"
            icon={ShieldCheck}
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <TronCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Blocked Domain Signal</h2>
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview?.most_blocked_domains || []}>
                  <CartesianGrid stroke="hsl(var(--primary) / 0.12)" vertical={false} />
                  <XAxis dataKey="domain" stroke="hsl(var(--muted))" tick={{ fontSize: 12 }} />
                  <YAxis stroke="hsl(var(--muted))" allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--primary) / 0.08)" }}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TronCard>

          <AdGuardStatus token={token} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TronCard>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Bypasses</h2>
              <Network className="h-5 w-5 text-primary" />
            </div>
            {overview?.active_bypasses.length ? (
              overview.active_bypasses.map((bypass) => (
                <MetricRow
                  key={bypass.id}
                  label={`${bypass.domain} ${bypass.client_ip ? `(${bypass.client_ip})` : ""}`}
                  value={formatDate(bypass.expires_at)}
                />
              ))
            ) : (
              <p className="py-8 text-sm text-muted">No active bypasses.</p>
            )}
          </TronCard>

          <TronCard id="activity">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Activity Feed</h2>
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <ActivityFeed logs={overview?.recent_logs || []} />
          </TronCard>
        </div>

        <div className="mt-5">
          <HouseholdManager token={token} />
        </div>

        <div className="mt-5">
          <UniFiSettings token={token} onSynced={() => refreshOverview()} />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <ModuleCard id="library" icon={Library} title="Library" detail="Books, borrowers, and checkouts are modeled for Phase 2." />
          <ModuleCard id="calendar" icon={CalendarClock} title="Future Modules" detail="Calendar, chores, approvals, schedules, inventory, and media." />
        </div>

        <div className="mt-5">
          <NotificationSettings token={token} />
        </div>
      </section>
    </main>
  );
}

function ModuleCard({
  id,
  icon: Icon,
  title,
  detail,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <TronCard id={id} className="min-h-[170px]">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </TronCard>
  );
}
