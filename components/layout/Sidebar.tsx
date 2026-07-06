"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
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

  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full flex-col gap-1 p-3"
    >
      <div
        className={cn(
          "mb-4 flex items-center gap-2 px-2 py-2",
          collapsed && "justify-center px-0",
        )}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-indigo-500 text-sm font-bold text-white shadow-md">
          S
        </span>
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Garage CRM
          </span>
        )}
      </div>

      {NAV_ITEMS.map((item) => {
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
                ? "bg-gradient-to-r from-brand/20 to-brand/5 text-brand shadow-sm ring-1 ring-white/50"
                : "text-gray-600 hover:bg-white/60 hover:text-ink",
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}

      {!collapsed && (
        <p className="mt-auto px-3 pt-4 text-xs text-gray-500">
          Summit Auto Group · USA
        </p>
      )}
    </nav>
  );
}
