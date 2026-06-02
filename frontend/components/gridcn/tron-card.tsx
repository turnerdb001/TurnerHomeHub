import { cn } from "@/lib/utils";

export function TronCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg border border-primary/40 bg-card/78 p-5 shadow-grid backdrop-blur",
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-primary/80",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}
