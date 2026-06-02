"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { TronCard } from "@/components/gridcn/tron-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");

  async function login() {
    try {
      const response = await api<{ access_token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("turner_token", response.access_token);
      router.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <main className="grid min-h-screen grid-surface place-items-center px-4">
      <TronCard className="w-full max-w-md p-7">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">Turner Home Hub</p>
        <h1 className="mt-3 text-3xl font-semibold">Admin Login</h1>
        <div className="mt-6 space-y-3">
          <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
          <Input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            onKeyDown={(event) => {
              if (event.key === "Enter") void login();
            }}
          />
          <Button onClick={login} className="w-full">
            <LogIn className="h-4 w-4" />
            Login
          </Button>
        </div>
      </TronCard>
    </main>
  );
}
