import { BookOpen, Home, LockKeyhole, Radar, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { MetricRow } from "@/components/gridcn/metric-row";
import { TronCard } from "@/components/gridcn/tron-card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen grid-surface px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-md border border-primary bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </span>
            <span>
              <span className="block text-xs uppercase tracking-[0.28em] text-primary">Turner</span>
              <span className="block text-2xl font-semibold">Home Hub</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/login">
              <Button>
                <LockKeyhole className="h-4 w-4" />
                Admin Login
              </Button>
            </Link>
            <Link href="/setup/adguard">
              <Button>
                <BookOpen className="h-4 w-4" />
                Setup
              </Button>
            </Link>
          </div>
        </header>

        <TronCard className="p-7">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">System Online</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
            Family network control, without pretending HTTPS is magic.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-muted">
            AdGuard handles DNS blocking on the network. Turner Home Hub handles profiles, devices, bypass approvals,
            logging, Discord notifications, and the manual block page.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <TronCard className="bg-background/45">
              <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
              <MetricRow label="Blocking mode" value="AdGuard DNS" />
            </TronCard>
            <TronCard className="bg-background/45">
              <Radar className="mb-3 h-5 w-5 text-primary" />
              <MetricRow label="Device source" value="Manual + UniFi" />
            </TronCard>
            <TronCard className="bg-background/45">
              <LockKeyhole className="mb-3 h-5 w-5 text-primary" />
              <MetricRow label="Bypass page" value="/block" />
            </TronCard>
          </div>
        </TronCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <TronCard>
            <h2 className="text-lg font-semibold">Manual Bypass Test</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Use this for testing PIN approvals and AdGuard temporary allow rules. Normal HTTPS blocks may show the
              browser privacy warning before any custom page can load.
            </p>
            <div className="mt-5">
              <Link href="/block?domain=youtube.com">
                <Button>Open block test</Button>
              </Link>
            </div>
          </TronCard>

          <TronCard>
            <h2 className="text-lg font-semibold">Recommended Pattern</h2>
            <div className="mt-4">
              <MetricRow label="Upstream DNS" value="Quad9 / preferred resolver" />
              <MetricRow label="Blocking" value="AdGuard filters" />
              <MetricRow label="Identity" value="Home Hub devices/profiles" />
              <MetricRow label="Notifications" value="Discord webhook" />
            </div>
          </TronCard>
        </div>
      </div>
    </main>
  );
}
