"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";

export function PinEntry({
  domain,
  clientIp,
  disabled,
}: {
  domain: string;
  clientIp: string | null;
  disabled: boolean;
}) {
  const [pin, setPin] = useState("");
  const [duration, setDuration] = useState("30m");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await api("/bypasses", {
        method: "POST",
        body: JSON.stringify({ domain, client_ip: clientIp, pin, duration }),
      });
      toast.success("Temporary bypass approved");
      setPin("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PIN failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="6-digit User PIN"
        type="password"
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
        disabled={disabled}
      />
      <Select value={duration} onChange={(event) => setDuration(event.target.value)} disabled={disabled}>
        <option value="5m">5 minutes</option>
        <option value="15m">15 minutes</option>
        <option value="30m">30 minutes</option>
        <option value="1h">1 hour</option>
        <option value="day">Rest of day</option>
      </Select>
      <Button onClick={submit} disabled={disabled || pin.length !== 6 || submitting} className="w-full">
        <ShieldCheck className="h-4 w-4" />
        Approve bypass
      </Button>
    </div>
  );
}
