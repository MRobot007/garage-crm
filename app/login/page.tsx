"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Login failed");
        setLoading(false);
        return;
      }
      // Redirect to the originally-requested page (open-redirect safe).
      const raw = new URLSearchParams(window.location.search).get("from") || "/";
      const dest = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Network error — is the server running?");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-strong w-full max-w-sm rounded-2xl p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="VOZIDEX" className="mb-3 h-20 w-20 object-contain" />
          <h1 className="text-lg font-semibold text-ink">VOZIDEX CRM</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the shop password to continue.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error || undefined}
            autoFocus
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <Button type="submit" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
