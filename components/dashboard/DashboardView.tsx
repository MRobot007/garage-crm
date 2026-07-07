"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "./StatCard";
import { DonutChart, type DonutSegment } from "./DonutChart";
import { Badge, leadStatusTone } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

/** Elegant teal-forward ramp with a single warm accent for negotiation. */
const STAGE_COLORS: Record<string, string> = {
  New: "#64748b", // slate
  Contacted: "#0d9488", // teal (brand)
  TestDrive: "#0891b2", // cyan
  Negotiation: "#f59e0b", // warm amber pop
  Won: "#059669", // emerald — success
  Lost: "#cbd5e1", // muted
};

export function DashboardView() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick pulse of the garage — leads, stock, sales and payments."
      />

      {isLoading && (
        <div className="flex items-center gap-2 py-20 text-gray-500">
          <Spinner /> Loading dashboard…
        </div>
      )}

      {isError && (
        <Card>
          <CardBody>
            <p className="text-sm text-bad">
              Couldn’t load the dashboard. Make sure the database is set up
              (`npm run db:push && npm run db:seed`).
            </p>
          </CardBody>
        </Card>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard label="Total Leads" value={data.totals.leads} accent="blue" />
            <StatCard label="Cars in Stock" value={data.totals.carsInStock} accent="green" />
            <StatCard label="Accessory Units" value={data.totals.accessoryUnits} accent="blue" />
            <StatCard label="Sales This Month" value={data.totals.salesThisMonth} format="inr" accent="green" />
            <StatCard label="Pending Payments" value={data.totals.pendingPayments} format="inr" accent="red" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Lead pipeline donut */}
            <Card>
              <CardHeader>
                <CardTitle>Lead pipeline</CardTitle>
                <Link href="/leads" className="text-sm font-medium text-brand hover:underline">
                  View leads →
                </Link>
              </CardHeader>
              <CardBody>
                <DonutChart
                  segments={data.funnel.map(
                    (s): DonutSegment => ({
                      label: LEAD_STATUS_LABELS[s.stage as LeadStatus] ?? s.stage,
                      value: s.count,
                      color: STAGE_COLORS[s.stage] ?? "#94a3b8",
                    }),
                  )}
                  centerLabel="leads"
                />
              </CardBody>
            </Card>

            {/* Follow-ups today */}
            <Card>
              <CardHeader>
                <CardTitle>Today’s follow-ups</CardTitle>
                <Badge tone={data.followUpsToday.length ? "amber" : "neutral"}>
                  {data.followUpsToday.length} due
                </Badge>
              </CardHeader>
              <CardBody className="p-0">
                {data.followUpsToday.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-500">
                    Nothing due today. 🎉
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {data.followUpsToday.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{l.name}</p>
                          <p className="truncate text-xs text-gray-500">
                            {l.phone}
                            {l.interestedIn ? ` · ${l.interestedIn}` : ""}
                          </p>
                        </div>
                        <Badge tone={leadStatusTone(l.status)}>
                          {LEAD_STATUS_LABELS[l.status as LeadStatus] ?? l.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Low stock */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Low-stock accessories</CardTitle>
              <Link href="/accessories" className="text-sm font-medium text-brand hover:underline">
                Manage stock →
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              {data.lowStock.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">
                  All accessories are above their reorder level.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.lowStock.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                        <p className="truncate text-xs text-gray-500">{a.sku}</p>
                      </div>
                      <Badge tone="red">
                        {a.qty} left / reorder {a.reorderLevel}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
