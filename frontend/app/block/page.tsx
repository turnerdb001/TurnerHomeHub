"use client";

import { AlertTriangle, Cpu, Home, LockKeyhole, Network } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Countdown } from "@/components/gridcn/countdown";
import { MetricRow } from "@/components/gridcn/metric-row";
import { TronCard } from "@/components/gridcn/tron-card";
import { PinEntry } from "@/components/pin-entry";
import { api } from "@/lib/api";

type VisitResponse = {
  domain: string | null;
  client_ip: string | null;
  device: string | null;
  profile: string | null;
  pin_allowed_at: string;
};

export default function BlockPage() {
  return (
    <Suspense fallback={<BlockFallback />}>
      <BlockContent />
    </Suspense>
  );
}

function BlockFallback() {
  return (
    <main className="grid min-h-screen grid-surface place-items-center px-4">
      <TronCard className="w-full max-w-md">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Turner Home Hub</p>
        <h1 className="mt-3 text-2xl font-semibold">Loading restriction context</h1>
      </TronCard>
    </main>
  );
}

function BlockContent() {
  const params = useSearchParams();
  const domain = params.get("domain") || "restricted.local";
  const [visit, setVisit] = useState<VisitResponse | null>(null);
  const [pinReady, setPinReady] = useState(false);

  useEffect(() => {
    api<VisitResponse>("/block/visit", {
      method: "POST",
      body: JSON.stringify({
        domain,
        user_agent: navigator.userAgent,
      }),
    }).then(setVisit).catch(() => {
      setVisit({
        domain,
        client_ip: null,
        device: null,
        profile: null,
        pin_allowed_at: new Date(Date.now() + 10_000).toISOString(),
      });
    });
  }, [domain]);

  return (
    <main className="grid min-h-screen grid-surface place-items-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md border border-primary bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="block text-xs uppercase tracking-[0.28em] text-primary">Turner</span>
              <span className="block text-2xl font-semibold">Home Hub</span>
            </span>
          </Link>
          <div className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
            Access Restricted
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <TronCard className="min-h-[520px] p-7">
            <div className="flex flex-col gap-8">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-danger/60 bg-danger/10 text-danger">
                  <AlertTriangle className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-danger">Access Restricted</p>
                  <h1 className="mt-3 break-all text-4xl font-semibold leading-tight text-foreground sm:text-6xl">
                    {domain}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                    This destination is blocked for this device or profile. A User PIN can open a temporary AdGuard bypass.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <TronCard className="bg-background/45">
                  <Network className="mb-3 h-5 w-5 text-primary" />
                  <MetricRow label="Client IP" value={visit?.client_ip || "detecting"} />
                </TronCard>
                <TronCard className="bg-background/45">
                  <Cpu className="mb-3 h-5 w-5 text-primary" />
                  <MetricRow label="Device" value={visit?.device || "unknown"} />
                </TronCard>
                <TronCard className="bg-background/45">
                  <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
                  <MetricRow label="Profile" value={visit?.profile || "unmatched"} />
                </TronCard>
              </div>
            </div>
          </TronCard>

          <TronCard className="p-7">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.22em] text-primary">Authorization</p>
              <h2 className="mt-2 text-2xl font-semibold">Temporary Bypass</h2>
            </div>
            <Countdown target={visit?.pin_allowed_at || null} onDone={() => setPinReady(true)} />
            <div className="mt-5">
              <PinEntry domain={domain} clientIp={visit?.client_ip || null} disabled={!pinReady} />
            </div>
          </TronCard>
        </div>
      </div>
    </main>
  );
}
