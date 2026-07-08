"use client";

import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { useTilt } from "@/hooks/useTilt";
import { formatMoney, formatNumber, cn } from "@/lib/utils";

type Accent = "teal" | "emerald" | "cyan" | "amber" | "violet" | "rose";

const ACCENTS: Record<Accent, { chip: string; bar: string }> = {
  teal: { chip: "from-teal-500 to-teal-600", bar: "from-teal-400 to-teal-600" },
  emerald: { chip: "from-emerald-500 to-emerald-600", bar: "from-emerald-400 to-emerald-600" },
  cyan: { chip: "from-cyan-500 to-cyan-600", bar: "from-cyan-400 to-cyan-600" },
  amber: { chip: "from-amber-400 to-amber-500", bar: "from-amber-300 to-amber-500" },
  violet: { chip: "from-violet-500 to-violet-600", bar: "from-violet-400 to-violet-600" },
  rose: { chip: "from-rose-400 to-rose-500", bar: "from-rose-300 to-rose-500" },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  accent?: Accent;
  format?: "inr" | "number";
  /** Percent change badge; null/undefined hides it. */
  delta?: number | null;
  /** 0..1 progress fill; undefined renders a faint decorative accent line. */
  progress?: number;
}

function DeltaBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        up ? "bg-emerald-500/12 text-emerald-600" : "bg-rose-500/12 text-rose-600",
      )}
    >
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {up ? "+" : ""}
      {value}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "teal",
  format = "number",
  delta,
  progress,
}: StatCardProps) {
  const n = useCountUp(value);
  const display = format === "inr" ? formatMoney(n) : formatNumber(n);
  const a = ACCENTS[accent];
  const fill = progress === undefined ? 1 : Math.max(0, Math.min(1, progress));
  const tilt = useTilt(7);

  return (
    <div
      {...tilt}
      className="glass spotlight fx-ring flex flex-col gap-4 rounded-2xl p-5 transition-transform duration-200"
    >
      <span className="spotlight-glow" aria-hidden />
      <span className="tilt-glare" aria-hidden />
      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md shadow-black/5 [&_svg]:h-[22px] [&_svg]:w-[22px]",
            a.chip,
          )}
        >
          {icon}
        </span>
        {delta !== null && delta !== undefined && <DeltaBadge value={delta} />}
      </div>

      <div className="relative">
        <p className="text-[26px] font-semibold leading-none tabular-nums text-ink">
          {display}
        </p>
        <p className="mt-1.5 text-sm text-slate-500">{label}</p>
      </div>

      <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-500/10">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r transition-[width] duration-700",
            a.bar,
            progress === undefined && "opacity-40",
          )}
          style={{ width: `${fill * 100}%` }}
        />
      </div>
    </div>
  );
}
