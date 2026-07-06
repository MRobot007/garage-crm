"use client";

import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";

interface FunnelProps {
  stages: { stage: string; count: number }[];
}

export function Funnel({ stages }: FunnelProps) {
  const max = Math.max(1, ...stages.map((s) => s.count));

  return (
    <ul className="space-y-3">
      {stages.map((s) => {
        const pct = Math.round((s.count / max) * 100);
        return (
          <li key={s.stage}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {LEAD_STATUS_LABELS[s.stage as LeadStatus] ?? s.stage}
              </span>
              <span className="tabular-nums text-gray-500">{s.count}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${Math.max(pct, s.count > 0 ? 6 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
