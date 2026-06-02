import { SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-11 w-full rounded-md border border-primary/30 bg-background/70 px-3 text-foreground outline-none focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
