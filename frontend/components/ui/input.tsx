import { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-md border border-primary/30 bg-background/70 px-3 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:shadow-pulse",
        className,
      )}
      {...props}
    />
  );
}
