"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatMoney, formatNumber, cn } from "@/lib/utils";
import type { TrendPoint, TrendRange } from "@/lib/types";

type Metric = "leads" | "sales";

const METRICS: Record<Metric, { label: string; color: string; light: string }> = {
  leads: { label: "New leads", color: "#0d9488", light: "#2dd4bf" },
  sales: { label: "Sales", color: "#059669", light: "#34d399" },
};

const RANGES: Array<{ key: TrendRange; short: string; sub: string }> = [
  { key: "week", short: "1W", sub: "last 7 days" },
  { key: "month", short: "1M", sub: "last 30 days" },
  { key: "sixMonths", short: "6M", sub: "last 6 months" },
  { key: "year", short: "1Y", sub: "last 12 months" },
];

const W = 720;
const H = 260;
const PAD_X = 16;
const PAD_TOP = 26;
const PAD_BOTTOM = 34;
const INNER_W = W - PAD_X * 2;
const INNER_H = H - PAD_TOP - PAD_BOTTOM;

/** Catmull-Rom → cubic bezier for a smooth line through the points. */
function smoothLine(pts: Array<[number, number]>): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function TrendChart({ data }: { data: Record<TrendRange, TrendPoint[]> }) {
  const [range, setRange] = useState<TrendRange>("week");
  const [metric, setMetric] = useState<Metric>("leads");
  const [hover, setHover] = useState<number | null>(null);

  const series: TrendPoint[] = data[range];
  const values = series.map((d) => d[metric]);
  const max = Math.max(...values, 1);
  const n = series.length;

  const x = (i: number) => (n <= 1 ? PAD_X : PAD_X + (i / (n - 1)) * INNER_W);
  const y = (v: number) => PAD_TOP + INNER_H * (1 - v / max);

  const points = values.map((v, i): [number, number] => [x(i), y(v)]);
  const linePath = smoothLine(points);
  const areaPath = points.length
    ? `${linePath} L ${x(n - 1)} ${PAD_TOP + INNER_H} L ${x(0)} ${PAD_TOP + INNER_H} Z`
    : "";

  const c = METRICS[metric];
  const fmt = (v: number) => (metric === "sales" ? formatMoney(v) : formatNumber(v));
  const sub = RANGES.find((r) => r.key === range)?.sub ?? "";

  // Keep the x-axis readable: show at most ~8 labels, always show individual
  // dots only when the series is short enough not to look busy.
  const labelStep = Math.max(1, Math.ceil(n / 8));
  const showDots = n <= 12;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((relX - PAD_X) / INNER_W) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink">Activity</h3>
          <p className="text-sm text-slate-500">New leads and sales · {sub}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg bg-slate-500/8 p-0.5">
            {(Object.keys(METRICS) as Metric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  metric === m ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink",
                )}
              >
                {METRICS[m].label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg bg-slate-500/8 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  setRange(r.key);
                  setHover(null);
                }}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  range === r.key ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink",
                )}
              >
                {r.short}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="block overflow-visible">
          <defs>
            <linearGradient id={`area-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={c.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={PAD_TOP + INNER_H * g}
              y2={PAD_TOP + INNER_H * g}
              stroke="rgba(15,60,55,0.06)"
              strokeWidth={1}
            />
          ))}

          <motion.path
            key={`${range}-${metric}-area`}
            d={areaPath}
            fill={`url(#area-${metric})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.path
            key={`${range}-${metric}-line`}
            d={linePath}
            fill="none"
            stroke={c.color}
            strokeWidth={3}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
          />

          {showDots &&
            points.map((p, i) => (
              <circle
                key={i}
                cx={p[0]}
                cy={p[1]}
                r={hover === i ? 5.5 : 3.5}
                fill="#fff"
                stroke={c.color}
                strokeWidth={2}
                className="transition-all"
              />
            ))}

          {hover !== null && (
            <>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={PAD_TOP}
                y2={PAD_TOP + INNER_H}
                stroke={c.light}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <circle cx={x(hover)} cy={y(values[hover])} r={5.5} fill="#fff" stroke={c.color} strokeWidth={2} />
            </>
          )}

          {series.map((d, i) =>
            i % labelStep === 0 || i === n - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={H - 10}
                textAnchor="middle"
                fontSize="12"
                fill="rgba(71,85,105,0.75)"
              >
                {d.label}
              </text>
            ) : null,
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              top: `${(y(values[hover]) / H) * 100}%`,
            }}
          >
            <div className="mb-2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-center shadow-lg">
              <p className="text-sm font-semibold text-white">{fmt(values[hover])}</p>
              <p className="text-[11px] text-white/60">{series[hover].label}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
