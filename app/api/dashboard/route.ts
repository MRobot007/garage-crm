import { prisma } from "@/lib/prisma";
import { ok, handle } from "@/lib/api";
import { FUNNEL_STAGES } from "@/lib/constants";
import type { DashboardData } from "@/lib/types";

export const dynamic = "force-dynamic";

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET() {
  return handle(async () => {
    const [
      leadCount,
      carsInStock,
      accessoryAgg,
      monthSales,
      unpaidInvoices,
      funnelGroups,
      followUps,
      lowStockAll,
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
        where: {
          followUpDate: { not: null, lte: endOfToday() },
          status: { notIn: ["Won", "Lost"] },
        },
        orderBy: { followUpDate: "asc" },
        take: 12,
      }),
      prisma.accessory.findMany({ orderBy: { qty: "asc" } }),
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
      funnel,
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
