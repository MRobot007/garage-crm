import { prisma } from "@/lib/prisma";
import { ok, handle } from "@/lib/api";
import { FUNNEL_STAGES } from "@/lib/constants";
import type { DashboardData } from "@/lib/types";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
function pctChange(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export async function GET() {
  return handle(async () => {
    // 7-day window (00:00 of 6 days ago) and the 14-day window for deltas.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const windowStart = days[0]; // start of the current 7-day window
    const priorStart = new Date(windowStart);
    priorStart.setDate(priorStart.getDate() - 7);

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
      leads14,
      invoices14,
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
        where: { createdAt: { gte: priorStart } },
        select: { createdAt: true },
      }),
      prisma.invoice.findMany({
        where: { date: { gte: priorStart } },
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

    // ---- 7-day trend buckets ----
    const leadDayMap = new Map<string, number>();
    const salesDayMap = new Map<string, number>();
    leads14.forEach((l) => {
      const k = dayKey(new Date(l.createdAt));
      leadDayMap.set(k, (leadDayMap.get(k) ?? 0) + 1);
    });
    invoices14.forEach((inv) => {
      const k = dayKey(new Date(inv.date));
      salesDayMap.set(k, (salesDayMap.get(k) ?? 0) + inv.total);
    });
    const trend = days.map((d) => ({
      label: WEEKDAYS[d.getDay()],
      leads: leadDayMap.get(dayKey(d)) ?? 0,
      sales: salesDayMap.get(dayKey(d)) ?? 0,
    }));

    // ---- 7d vs prior-7d deltas ----
    const leadsLast7 = leads14.filter((l) => new Date(l.createdAt) >= windowStart).length;
    const leadsPrior7 = leads14.length - leadsLast7;
    const salesLast7 = invoices14
      .filter((i) => new Date(i.date) >= windowStart)
      .reduce((s, i) => s + i.total, 0);
    const salesPrior7 = invoices14.reduce((s, i) => s + i.total, 0) - salesLast7;

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
