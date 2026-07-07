"use client";

import { useEffect, useMemo, useRef } from "react";
import anime from "animejs";
import { prefersReducedMotion } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * An elegant animated donut chart. Each segment grows in, staggered.
 * Falls back to a static ring under prefers-reduced-motion.
 */
export function DonutChart({
  segments,
  centerLabel,
}: {
  segments: DonutSegment[];
  centerLabel?: string;
}) {
  const size = 184;
  const stroke = 26;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const C = 2 * Math.PI * r;

  const circleRefs = useRef<Array<SVGCircleElement | null>>([]);
  const total = segments.reduce((s, x) => s + x.value, 0);

  const arcs = useMemo(() => {
    let acc = 0;
    return segments.map((seg) => {
      const frac = total > 0 ? seg.value / total : 0;
      const len = frac * C;
      const offset = -acc * C;
      acc += frac;
      return { ...seg, len, offset };
    });
  }, [segments, total, C]);

  useEffect(() => {
    const els = circleRefs.current;
    if (prefersReducedMotion()) {
      arcs.forEach((a, i) => {
        const el = els[i];
        if (el) el.style.strokeDasharray = `${a.len} ${C}`;
      });
      return;
    }
    const anims = arcs.map((a, i) => {
      const el = els[i];
      if (!el) return null;
      el.style.strokeDasharray = `0 ${C}`;
      const obj = { v: 0 };
      return anime({
        targets: obj,
        v: a.len,
        duration: 850,
        delay: 120 + i * 110,
        easing: "easeOutCubic",
        update: () => {
          el.style.strokeDasharray = `${obj.v} ${C}`;
        },
      });
    });
    return () => anims.forEach((a) => a?.pause());
  }, [arcs, C]);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="rgba(15,60,55,0.06)"
            strokeWidth={stroke}
          />
          {arcs.map((a, i) => (
            <circle
              key={a.label}
              ref={(el) => {
                circleRefs.current[i] = el;
              }}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`0 ${C}`}
              strokeDashoffset={a.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums text-ink">{total}</span>
          {centerLabel && (
            <span className="text-xs text-slate-400">{centerLabel}</span>
          )}
        </div>
      </div>

      <ul className="min-w-[9rem] flex-1 space-y-2">
        {arcs.map((a) => (
          <li key={a.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-500">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: a.color }}
              />
              {a.label}
            </span>
            <span className="tabular-nums font-medium text-ink">
              {a.value}
              <span className="ml-1 text-xs text-slate-400">
                {total > 0 ? Math.round((a.value / total) * 100) : 0}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
