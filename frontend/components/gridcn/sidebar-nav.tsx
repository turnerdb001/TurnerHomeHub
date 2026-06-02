import { BookOpen, CalendarDays, Gauge, Home, Network, Radar, Settings, Shield, Users } from "lucide-react";
import Link from "next/link";

const items = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin#activity", label: "Activity", icon: Shield },
  { href: "/admin#devices", label: "Devices", icon: Network },
  { href: "/admin#profiles", label: "Profiles", icon: Users },
  { href: "/admin#unifi", label: "UniFi", icon: Radar },
  { href: "/admin#library", label: "Library", icon: BookOpen },
  { href: "/admin#calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin#settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-primary/25 bg-background/70 p-5 backdrop-blur lg:block">
      <Link href="/block" className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-md border border-primary bg-primary/10">
          <Home className="h-5 w-5 text-primary" />
        </span>
        <span>
          <span className="block text-sm uppercase tracking-[0.2em] text-primary">Turner</span>
          <span className="block text-lg font-semibold">Home Hub</span>
        </span>
      </Link>
      <nav className="mt-10 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md border border-transparent px-3 py-3 text-sm text-foreground/82 transition hover:border-primary/40 hover:bg-primary/10"
          >
            <item.icon className="h-4 w-4 text-primary" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
