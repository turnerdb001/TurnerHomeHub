import { formatDate } from "@/lib/utils";

type Log = {
  id: number;
  timestamp: string;
  action: string;
  client_ip: string | null;
  domain: string | null;
  result: string;
};

export function ActivityFeed({ logs }: { logs: Log[] }) {
  return (
    <div className="divide-y divide-primary/15">
      {logs.slice(0, 12).map((log) => (
        <div key={log.id} className="grid gap-2 py-3 sm:grid-cols-[150px_1fr_auto] sm:items-center">
          <span className="font-mono text-xs text-muted">{formatDate(log.timestamp)}</span>
          <span className="text-sm">
            <span className="text-primary">{log.action.replaceAll("_", " ")}</span>
            {log.domain ? ` for ${log.domain}` : ""}
          </span>
          <span className="font-mono text-xs text-foreground/70">{log.client_ip || "unknown"}</span>
        </div>
      ))}
    </div>
  );
}
