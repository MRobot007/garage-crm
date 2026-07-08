import { prisma } from "@/lib/prisma";
import { ok, handle } from "@/lib/api";
import { FUNNEL_STAGES } from "@/lib/constants";
import type { DashboardData, TrendPoint } from "@/lib/types";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}
/** The last `count` day-starts, oldest → newest. */
function dayStarts(count: number): Date[] {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}
/** The last `count` month-starts, oldest → newest. */
function monthStarts(count: number): Date[] {
  const n = new Date();
  const out: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(new Date(n.getFullYear(), n.getMonth() - i, 1));
  }
  return out;
}
function pctChange(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export async function GET() {
  return handle(async () => {
    const yearStart = monthStarts(12)[0]; // earliest bucket we need

    const [
      leadCount,
      carsInStock,
      accessoryAgg,
      monthSales,
      unpaidInvoices,
      funnelGroups,
      recentLeadsRaw,
      followUps,
      lowStockAll,
      leadsYear,
      invoicesYear,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.car.count({ where: { status: { not: "Sold" } } }),
      prisma.accessory.aggregate({ _sum: { qty: true } }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { date: { gte: startOfMonth() } },
      }),
      prisma.invoice.findMany({
        where: { status: { not: "Paid" } },
        select: { total: true, received: true },
      }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.lead.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          name: true,
          interestedIn: true,
          source: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.lead.findMany({
        where: {
          followUpDate: { not: null, lte: endOfToday() },
          status: { notIn: ["Won", "Lost"] },
        },
        orderBy: { followUpDate: "asc" },
        take: 12,
      }),
      prisma.accessory.findMany({ orderBy: { qty: "asc" } }),
      prisma.lead.findMany({
        where: { createdAt: { gte: yearStart } },
        select: { createdAt: true },
      }),
      prisma.invoice.findMany({
        where: { date: { gte: yearStart } },
        select: { date: true, total: true },
      }),
    ]);

    const pendingPayments = unpaidInvoices.reduce(
      (sum, i) => sum + Math.max(0, i.total - i.received),
      0,
    );

    const funnelMap = new Map<string, number>();
    funnelGroups.forEach((g) => funnelMap.set(g.status, g._count._all));
    const funnel = FUNNEL_STAGES.map((stage) => ({
      stage,
      count: funnelMap.get(stage) ?? 0,
    }));

    // ---- Trend buckets (daily + monthly) ----
    const leadDay = new Map<string, number>();
    const salesDay = new Map<string, number>();
    const leadMonth = new Map<string, number>();
    const salesMonth = new Map<string, number>();
    leadsYear.forEach((l) => {
      const d = new Date(l.createdAt);
      leadDay.set(dayKey(d), (leadDay.get(dayKey(d)) ?? 0) + 1);
      leadMonth.set(monthKey(d), (leadMonth.get(monthKey(d)) ?? 0) + 1);
    });
    invoicesYear.forEach((inv) => {
      const d = new Date(inv.date);
      salesDay.set(dayKey(d), (salesDay.get(dayKey(d)) ?? 0) + inv.total);
      salesMonth.set(monthKey(d), (salesMonth.get(monthKey(d)) ?? 0) + inv.total);
    });

    const daily = (starts: Date[], label: (d: Date) => string): TrendPoint[] =>
      starts.map((d) => ({
        label: label(d),
        leads: leadDay.get(dayKey(d)) ?? 0,
        sales: salesDay.get(dayKey(d)) ?? 0,
      }));
    const monthly = (starts: Date[]): TrendPoint[] =>
      starts.map((d) => ({
        label: MONTHS[d.getMonth()],
        leads: leadMonth.get(monthKey(d)) ?? 0,
        sales: salesMonth.get(monthKey(d)) ?? 0,
      }));

    const trend = {
      week: daily(dayStarts(7), (d) => WEEKDAYS[d.getDay()]),
      month: daily(dayStarts(30), (d) => `${d.getMonth() + 1}/${d.getDate()}`),
      sixMonths: monthly(monthStarts(6)),
      year: monthly(monthStarts(12)),
    };

    // ---- 7d vs prior-7d deltas ----
    const weekStart = dayStarts(7)[0];
    const prior7Start = new Date(weekStart);
    prior7Start.setDate(prior7Start.getDate() - 7);
    const inRange = (d: Date, from: Date, to: Date) => d >= from && d < to;
    const leadsLast7 = leadsYear.filter((l) => new Date(l.createdAt) >= weekStart).length;
    const leadsPrior7 = leadsYear.filter((l) =>
      inRange(new Date(l.createdAt), prior7Start, weekStart),
    ).length;
    const salesLast7 = invoicesYear
      .filter((i) => new Date(i.date) >= weekStart)
      .reduce((s, i) => s + i.total, 0);
    const salesPrior7 = invoicesYear
      .filter((i) => inRange(new Date(i.date), prior7Start, weekStart))
      .reduce((s, i) => s + i.total, 0);

    const lowStock = lowStockAll
      .filter((a) => a.qty <= a.reorderLevel)
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        name: a.name,
        sku: a.sku,
        qty: a.qty,
        reorderLevel: a.reorderLevel,
      }));

    const data: DashboardData = {
      totals: {
        leads: leadCount,
        carsInStock,
        accessoryUnits: accessoryAgg._sum.qty ?? 0,
        salesThisMonth: monthSales._sum.total ?? 0,
        pendingPayments,
      },
      deltas: {
        leads: pctChange(leadsLast7, leadsPrior7),
        sales: pctChange(salesLast7, salesPrior7),
      },
      trend,
      funnel,
      recentLeads: recentLeadsRaw.map((l) => ({
        id: l.id,
        name: l.name,
        interestedIn: l.interestedIn,
        source: l.source,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
      followUpsToday: followUps.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        interestedIn: l.interestedIn,
        status: l.status,
        followUpDate: l.followUpDate ? l.followUpDate.toISOString() : null,
        staff: l.staff,
      })),
      lowStock,
    };

    return ok(data);
  });
}
