"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Car,
  Package,
  DollarSign,
  Wallet,
  ArrowRight,
  Store,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatCard } from "./StatCard";
import { DonutChart, type DonutSegment } from "./DonutChart";
import { TrendChart } from "./TrendChart";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { Reveal } from "@/components/ui/Reveal";
import { Badge, leadStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

/** Elegant teal-forward ramp with a single warm accent for negotiation. */
const STAGE_COLORS: Record<string, string> = {
  New: "#64748b",
  Contacted: "#e11f26",
  TestDrive: "#0891b2",
  Negotiation: "#f59e0b",
  Won: "#059669",
  Lost: "#cbd5e1",
};

const share = (part: number, whole: number) => (whole > 0 ? part / whole : 0);

export function DashboardView() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="A quick pulse of the garage — leads, stock, sales and payments."
        actions={
          <Link
            href="/pos"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-b from-brand to-red-700 px-4 text-sm font-semibold text-white shadow-md shadow-brand/25 transition-all hover:brightness-[1.08] active:scale-[0.97]"
          >
            <Store className="h-4 w-4" />
            Launch POS
          </Link>
        }
      />

      {isLoading && <DashboardSkeleton />}

      {isError && (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm font-medium text-ink">
              We couldn’t load your dashboard right now.
            </p>
            <p className="max-w-sm text-sm text-slate-500">
              This is usually a brief network hiccup. Please try again in a moment.
            </p>
            <Button variant="secondary" loading={isFetching} onClick={() => refetch()}>
              Try again
            </Button>
          </CardBody>
        </Card>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <motion.div
            className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {[
              <StatCard
                key="leads"
                label="Total Leads"
                value={data.totals.leads}
                icon={<Users />}
                accent="teal"
                delta={data.deltas.leads}
                progress={share(
                  data.funnel.find((f) => f.stage === "Won")?.count ?? 0,
                  data.totals.leads,
                )}
              />,
              <StatCard
                key="cars"
                label="Vehicles in Stock"
                value={data.totals.carsInStock}
                icon={<Car />}
                accent="cyan"
              />,
              <StatCard
                key="acc"
                label="Accessory Units"
                value={data.totals.accessoryUnits}
                icon={<Package />}
                accent="violet"
              />,
              <StatCard
                key="sales"
                label="Sales This Month"
                value={data.totals.salesThisMonth}
                format="inr"
                icon={<DollarSign />}
                accent="emerald"
                delta={data.deltas.sales}
                progress={share(
                  data.totals.salesThisMonth,
                  data.totals.salesThisMonth + data.totals.pendingPayments,
                )}
              />,
              <StatCard
                key="pending"
                label="Pending Payments"
                value={data.totals.pendingPayments}
                format="inr"
                icon={<Wallet />}
                accent="amber"
                progress={share(
                  data.totals.pendingPayments,
                  data.totals.salesThisMonth + data.totals.pendingPayments,
                )}
              />,
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                {card}
              </motion.div>
            ))}
          </motion.div>

          {/* Trend chart + pipeline donut */}
          <Reveal className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 fx-ring">
              <CardBody>
                <TrendChart data={data.trend} />
              </CardBody>
            </Card>

            <Card className="fx-ring">
              <CardHeader>
                <CardTitle>Lead pipeline</CardTitle>
                <Link href="/leads" className="text-sm font-medium text-brand hover:underline">
                  View →
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
          </Reveal>

          {/* Recent leads + follow-ups */}
          <Reveal className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div>
                  <CardTitle>Recent leads</CardTitle>
                  <p className="mt-0.5 text-sm text-slate-500">Newest enquiries across all sources</p>
                </div>
                <Link
                  href="/leads"
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </CardHeader>
              <CardBody className="p-0">
                {data.recentLeads.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-gray-500">No leads yet.</p>
                ) : (
                  <div className="scroll-x">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-slate-400">
                          <th className="px-5 py-2.5 font-medium">Lead</th>
                          <th className="px-3 py-2.5 font-medium">Source</th>
                          <th className="px-3 py-2.5 font-medium">Status</th>
                          <th className="px-5 py-2.5 text-right font-medium">Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentLeads.map((l) => (
                          <tr
                            key={l.id}
                            className="border-b border-line/60 transition-colors last:border-0 hover:bg-white/50"
                          >
                            <td className="px-5 py-3">
                              <p className="font-medium text-ink">{l.name}</p>
                              {l.interestedIn && (
                                <p className="truncate text-xs text-slate-500">{l.interestedIn}</p>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <Badge tone="neutral">{l.source}</Badge>
                            </td>
                            <td className="px-3 py-3">
                              <Badge tone={leadStatusTone(l.status)}>
                                {LEAD_STATUS_LABELS[l.status as LeadStatus] ?? l.status}
                              </Badge>
                            </td>
                            <td className="px-5 py-3 text-right text-xs text-slate-500">
                              {formatDate(l.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>

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
          </Reveal>

          {/* Low stock */}
          <Reveal>
          <Card className="mt-6 fx-ring">
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
          </Reveal>
        </>
      )}
    </div>
  );
}
