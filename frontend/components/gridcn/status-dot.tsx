import { cn } from "@/lib/utils";

export function StatusDot({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-2.5 w-2.5 rounded-full",
        online ? "bg-primary shadow-pulse" : "bg-danger",
      )}
    />
  );
}
