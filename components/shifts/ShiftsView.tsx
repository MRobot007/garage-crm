"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrap, THead, TH, TBody, TR, TD } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { useShifts, useStartShift, useEndShift } from "@/hooks/useShifts";
import { useStaggerReveal } from "@/hooks/useStaggerReveal";
import { formatMoney } from "@/lib/utils";
import { ApiError } from "@/lib/fetcher";
import type { ShiftEntry } from "@/lib/types";

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function duration(startIso: string, endIso: string | null, now: number): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : now;
  const mins = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function ShiftsView() {
  const toast = useToast();
  const { data: shifts, isLoading, isError } = useShifts();
  const start = useStartShift();
  const end = useEndShift();

  // Tick so the active-shift duration updates live.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const active = shifts?.find((s) => !s.endedAt) ?? null;
  const bodyRef = useStaggerReveal<HTMLTableSectionElement>("tr", shifts?.length ?? 0);

  async function onStart() {
    try {
      await start.mutateAsync();
      toast.success("Shift started");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn’t start shift");
    }
  }
  async function onEnd() {
    try {
      await end.mutateAsync();
      toast.success("Shift ended");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Couldn’t end shift");
    }
  }

  return (
    <div>
      <PageHeader
        title="Shifts"
        subtitle="Clock in and out. Your sales are tracked per shift — download a CSV anytime."
      />

      {/* Active-shift card */}
      <Card className="mb-6">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          {active ? (
            <>
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-ok" />
                </span>
                <div>
                  <p className="font-medium text-ink">You’re on shift</p>
                  <p className="text-sm text-gray-500">
                    Started {fmtTime(active.startedAt)} · {duration(active.startedAt, null, now)} so far
                  </p>
                </div>
              </div>
              <Button variant="danger" onClick={onEnd} loading={end.isPending}>
                End shift
              </Button>
            </>
          ) : (
            <>
              <div>
                <p className="font-medium text-ink">You’re off shift</p>
                <p className="text-sm text-gray-500">
                  Start a shift so your sales are grouped and exportable.
                </p>
              </div>
              <Button onClick={onStart} loading={start.isPending}>
                Start shift
              </Button>
            </>
          )}
        </CardBody>
      </Card>

      {isLoading && (
        <div className="flex items-center gap-2 py-16 text-gray-500">
          <Spinner /> Loading shifts…
        </div>
      )}
      {isError && (
        <p className="py-16 text-center text-sm text-bad">Couldn’t load shifts.</p>
      )}

      {shifts && shifts.length === 0 && (
        <EmptyState
          title="No shifts yet"
          description="Start your first shift above to begin tracking your sales."
        />
      )}

      {shifts && shifts.length > 0 && (
        <TableWrap>
          <THead>
            <tr>
              <TH>Started</TH>
              <TH>Ended</TH>
              <TH>Duration</TH>
              <TH className="text-right">Sales</TH>
              <TH className="text-right">Total</TH>
              <TH className="text-right">CSV</TH>
            </tr>
          </THead>
          <TBody ref={bodyRef}>
            {shifts.map((s: ShiftEntry) => (
              <TR key={s.id}>
                <TD className="whitespace-nowrap text-gray-600">{fmtTime(s.startedAt)}</TD>
                <TD className="whitespace-nowrap text-gray-600">
                  {s.endedAt ? fmtTime(s.endedAt) : <Badge tone="green">Active</Badge>}
                </TD>
                <TD className="text-gray-600">{duration(s.startedAt, s.endedAt, now)}</TD>
                <TD className="text-right tabular-nums">{s.salesCount}</TD>
                <TD className="text-right tabular-nums font-medium">{formatMoney(s.salesTotal)}</TD>
                <TD className="text-right">
                  <a
                    href={`/api/shifts/${s.id}/export`}
                    className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-brand hover:bg-white/60"
                  >
                    ↓ Download
                  </a>
                </TD>
              </TR>
            ))}
          </TBody>
        </TableWrap>
      )}
    </div>
  );
}
