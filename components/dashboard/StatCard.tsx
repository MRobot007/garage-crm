"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { formatMoney, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  format?: "inr" | "number";
  accent?: "blue" | "green" | "amber" | "red";
  hint?: string;
}

const ACCENT_BAR: Record<NonNullable<StatCardProps["accent"]>, string> = {
  blue: "bg-brand",
  green: "bg-ok",
  amber: "bg-warn",
  red: "bg-bad",
};

export function StatCard({
  label,
  value,
  format = "number",
  accent = "blue",
  hint,
}: StatCardProps) {
  const n = useCountUp(value);
  const display = format === "inr" ? formatMoney(n) : formatNumber(n);

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5">
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-1.5",
          ACCENT_BAR[accent],
        )}
        aria-hidden
      />
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
        {display}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
