"use client";

import { useEffect, useState } from "react";

export function Countdown({ target, onDone }: { target: string | null; onDone?: () => void }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const ms = Math.max(0, new Date(target).getTime() - Date.now());
      setRemaining(Math.ceil(ms / 1000));
      if (ms <= 0) onDone?.();
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [target, onDone]);

  return (
    <div className="grid min-h-20 place-items-center rounded-lg border border-primary/30 bg-primary/10 px-4">
      <span className="font-mono text-4xl text-primary">{remaining.toString().padStart(2, "0")}</span>
      <span className="text-xs uppercase tracking-[0.18em] text-muted">PIN gate</span>
    </div>
  );
}
