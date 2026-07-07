"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalSearch } from "./GlobalSearch";
import { useSettings } from "@/hooks/useSettings";
import { useMe } from "@/hooks/useMe";
import { ROLE_LABELS, type Role } from "@/lib/constants";

interface TopbarProps {
  onToggleCollapse: () => void;
  onOpenDrawer: () => void;
}

export function Topbar({ onToggleCollapse, onOpenDrawer }: TopbarProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: settings } = useSettings();
  const { data: me } = useMe();
  const [today, setToday] = useState("");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    qc.clear();
    router.replace("/login");
    router.refresh();
  }

  // Set the date on the client to avoid SSR/client timezone mismatch.
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
  }, []);

  return (
    <header className="glass-nav no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/50 px-4">
      {/* Mobile: open drawer */}
      <button
        onClick={onOpenDrawer}
        aria-label="Open menu"
        className="grid h-9 w-9 place-items-center rounded-lg text-gray-600 hover:bg-white/60 md:hidden"
      >
        <HamburgerIcon />
      </button>

      {/* Desktop: collapse sidebar */}
      <button
        onClick={onToggleCollapse}
        aria-label="Toggle sidebar"
        className="hidden h-9 w-9 place-items-center rounded-lg text-gray-600 hover:bg-white/60 md:grid"
      >
        <HamburgerIcon />
      </button>

      <span className="mr-1 hidden text-[15px] font-semibold tracking-tight text-ink sm:block">
        {settings?.businessName ?? "VOZIDEX"}
      </span>

      <div className="flex flex-1 justify-center px-2">
        <GlobalSearch />
      </div>

      <time className="hidden shrink-0 text-sm text-gray-500 sm:block">
        {today || " "}
      </time>

      {me && (
        <div className="hidden shrink-0 border-l border-white/50 pl-3 text-right sm:block">
          <div className="text-sm font-medium leading-tight text-ink">{me.name}</div>
          <div className="text-xs text-gray-500">
            {ROLE_LABELS[me.role as Role] ?? me.role}
          </div>
        </div>
      )}

      <button
        onClick={logout}
        aria-label="Log out"
        title="Log out"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-600 hover:bg-white/60 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5M21 12H9" />
        </svg>
      </button>
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
