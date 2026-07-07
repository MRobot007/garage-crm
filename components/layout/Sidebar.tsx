"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { useMe } from "@/hooks/useMe";
import type { Role } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  /** Called when a nav link is chosen (used to close the mobile drawer). */
  onNavigate?: () => void;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { data: me } = useMe();
  const role = me?.role as Role | undefined;
  const items = NAV_ITEMS.filter(
    (item) => !item.roles || (role ? item.roles.includes(role) : false),
  );

  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full flex-col gap-1 bg-[linear-gradient(180deg,#0c4a45_0%,#0a3a37_50%,#062725_100%)] p-3 text-teal-50"
    >
      <div
        className={cn(
          "mb-4 flex items-center gap-2.5 px-2 py-2",
          collapsed && "justify-center px-0",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="VOZIDEX"
          className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        />
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-white">
            VOZIDEX
          </span>
        )}
      </div>

      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center px-0",
              active
                ? "bg-white/[0.13] text-white shadow-sm ring-1 ring-inset ring-white/15"
                : "text-teal-50/70 hover:bg-white/[0.08] hover:text-white",
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}

      {!collapsed && (
        <p className="mt-auto px-3 pt-4 text-xs text-teal-100/45">
          VOZIDEX Customs · USA
        </p>
      )}
    </nav>
  );
}
