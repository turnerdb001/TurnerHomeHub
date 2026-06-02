import { AlertTriangle, ArrowRight, Bell, CheckCircle2, Network, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { MetricRow } from "@/components/gridcn/metric-row";
import { TronCard } from "@/components/gridcn/tron-card";
import { Button } from "@/components/ui/button";

const filterRules = ["||youtube.com^", "||tiktok.com^", "||character.ai^"];
const optionalRewrites = [
  "blocked.home.arpa -> 192.168.1.164",
  "homehub.home.arpa -> 192.168.1.164",
];

export default function AdGuardSetupPage() {
  return (
    <main className="min-h-screen grid-surface px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-primary">Setup</p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">AdGuard Network Blocking Mode</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button>Home</Button>
            </Link>
            <Link href="/login">
              <Button>Admin</Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <TronCard className="p-7">
            <ShieldCheck className="mb-4 h-7 w-7 text-primary" />
            <h2 className="text-2xl font-semibold">Recommended Pattern</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              Let AdGuard block DNS normally. Use Turner Home Hub for device ownership, profile matching, Discord
              notifications, logs, and temporary bypass approvals. This avoids fragile HTTPS interception.
            </p>
            <div className="mt-5">
              <MetricRow label="Upstream DNS" value="Quad9 or your preferred resolver" />
              <MetricRow label="Blocked domains" value="AdGuard filter rules" />
              <MetricRow label="Custom page" value="/block for manual/test flows" />
              <MetricRow label="Bypass" value="temporary AdGuard allow rules" />
            </div>
          </TronCard>

          <TronCard className="p-7">
            <AlertTriangle className="mb-4 h-7 w-7 text-danger" />
            <h2 className="text-2xl font-semibold">HTTPS Reality</h2>
            <p className="mt-4 text-sm leading-6 text-muted">
              When a browser opens an HTTPS site, it expects a certificate for that exact site. If DNS sends
              `youtube.com` to Home Hub, Home Hub cannot present a valid `youtube.com` certificate. The browser may show
              a privacy warning before any custom page appears.
            </p>
            <p className="mt-4 text-sm leading-6 text-muted">
              That is why Home Hub treats AdGuard as the blocker and the `/block` page as a manual/test approval surface.
            </p>
          </TronCard>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <TronCard>
            <Network className="mb-4 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">1. Upstream DNS</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Keep your upstream DNS providers in AdGuard. Do not put Home Hub here.
            </p>
            <div className="mt-4 rounded-md border border-primary/20 bg-background/60 p-3 font-mono text-xs text-primary">
              https://dns10.quad9.net/dns-query
            </div>
          </TronCard>

          <TronCard>
            <ShieldCheck className="mb-4 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">2. Filtering Rules</h3>
            <p className="mt-3 text-sm leading-6 text-muted">Use AdGuard custom filtering rules for blocked domains.</p>
            <div className="mt-4 space-y-2">
              {filterRules.map((rule) => (
                <div key={rule} className="rounded-md border border-primary/20 bg-background/60 p-3 font-mono text-xs text-primary">
                  {rule}
                </div>
              ))}
            </div>
          </TronCard>

          <TronCard>
            <Bell className="mb-4 h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">3. Home Hub</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Sync devices, assign profiles, turn on Discord, and use User PINs for temporary bypass approvals.
            </p>
            <div className="mt-5">
              <Link href="/login">
                <Button>
                  Configure
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </TronCard>
        </div>

        <TronCard className="mt-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Optional Local Names</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                DNS rewrites for your own local names are useful for testing and convenience. They do not solve HTTPS
                certificate warnings for public blocked domains.
              </p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {optionalRewrites.map((rewrite) => (
                  <div key={rewrite} className="rounded-md border border-primary/20 bg-background/60 p-3 font-mono text-xs text-primary">
                    {rewrite}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-primary/20 bg-background/60 p-3 font-mono text-xs text-primary">
                http://blocked.home.arpa:8090/block?domain=youtube.com
              </div>
            </div>
          </div>
        </TronCard>
      </div>
    </main>
  );
}
