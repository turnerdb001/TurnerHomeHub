import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary/50 bg-primary/12 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/22 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
