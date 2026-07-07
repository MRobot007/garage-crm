"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { buttonVariants } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/shadcn";

export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const reduce = useReducedMotion();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Login failed");
        setLoading(false);
        return;
      }
      // Refresh the cached "me" so nav/permissions load for this user.
      await qc.invalidateQueries();
      const raw = new URLSearchParams(window.location.search).get("from") || "/";
      const dest = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
      router.replace(dest);
      router.refresh();
    } catch {
      setError("Network error — is the server running?");
      setLoading(false);
    }
  }

  function fillDemo() {
    setUsername("owner");
    setPassword("123456");
    setError("");
  }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-[400px]"
    >
      {/* Mobile brand mark (brand panel is hidden < lg) */}
      <motion.div variants={item} className="mb-8 flex items-center gap-3 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="VOZIDEX" className="h-11 w-11 object-contain" />
        <span className="text-lg font-semibold tracking-tight text-ink">VOZIDEX</span>
      </motion.div>

      <motion.p
        variants={item}
        className="text-xs font-semibold uppercase tracking-[0.18em] text-brand"
      >
        Welcome back
      </motion.p>
      <motion.h1
        variants={item}
        className="mt-2 text-[26px] font-semibold tracking-tight text-ink"
      >
        Sign in to your workspace
      </motion.h1>
      <motion.p variants={item} className="mt-1.5 text-sm text-muted-foreground">
        Enter your credentials to access the CRM.
      </motion.p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        {/* Username */}
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="e.g. owner"
              className="pl-11"
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              autoComplete="current-password"
              placeholder="••••••••"
              className="px-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: reduce ? 0 : -4 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.div variants={item}>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={reduce || loading ? undefined : { scale: 1.01 }}
            whileTap={reduce || loading ? undefined : { scale: 0.985 }}
            className={cn(
              buttonVariants({ size: "lg" }),
              "group relative w-full overflow-hidden bg-[linear-gradient(180deg,#0d9488_0%,#0f766e_100%)] text-white shadow-lg shadow-teal-700/25",
            )}
          >
            {/* sheen */}
            <span className="absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)] transition-transform duration-700 group-hover:translate-x-full" />
            {loading ? (
              <>
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <ArrowRight className="h-[18px] w-[18px] transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </motion.button>
        </motion.div>
      </form>

      {/* Demo helper */}
      <motion.button
        variants={item}
        type="button"
        onClick={fillDemo}
        className="group mt-6 flex w-full items-center justify-between rounded-xl border border-border bg-white/50 px-4 py-3 text-left transition-colors hover:border-brand/40 hover:bg-accent"
      >
        <span className="flex items-center gap-2.5">
          <ShieldCheck className="h-4 w-4 text-brand" />
          <span className="text-sm text-muted-foreground">
            Demo access ·{" "}
            <span className="font-medium text-ink">owner</span> /{" "}
            <span className="font-medium text-ink">123456</span>
          </span>
        </span>
        <span className="text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
          Fill
        </span>
      </motion.button>
    </motion.div>
  );
}
