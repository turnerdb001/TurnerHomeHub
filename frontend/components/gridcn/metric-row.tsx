export function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-primary/15 py-3 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="font-mono text-sm text-primary">{value}</span>
    </div>
  );
}
