import { LucideIcon } from "lucide-react";
import { TronCard } from "./tron-card";

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <TronCard className="min-h-[132px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary/80">{label}</p>
          <p className="mt-3 text-4xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-md border border-primary/40 bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">{detail}</p>
    </TronCard>
  );
}
