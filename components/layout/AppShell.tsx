"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Atmosphere } from "./Atmosphere";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // The login screen and the POS terminal render standalone (full-screen),
  // without the sidebar/top bar.
  if (pathname === "/login" || pathname === "/pos") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Atmosphere />
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "no-print hidden shrink-0 border-r border-black/10 shadow-[4px_0_24px_-12px_rgba(6,39,37,0.5)] transition-[width] duration-200 md:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="sticky top-0 h-screen overflow-y-auto">
          <Sidebar collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="no-print fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-64 shadow-2xl">
            <Sidebar collapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
