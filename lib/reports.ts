import { prisma } from "@/lib/prisma";
import { DEAD_STOCK_DAYS } from "@/lib/constants";
import { daysSince } from "@/lib/utils";
import type { ReportsData } from "@/lib/types";

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Build the "business snapshot" report for the current month.
 * Shared by the reports API and the CSV export route.
 */
export async function buildReports(): Promise<ReportsData> {
  const monthStart = startOfMonth();

  const [monthInvoices, leadsBySourceRaw, wonBySourceRaw, cars, accessories] =
    await Promise.all([
      prisma.invoice.findMany({
        where: { date: { gte: monthStart } },
        include: { items: true },
      }),
      prisma.lead.groupBy({ by: ["source"], _count: { _all: true } }),
      prisma.lead.groupBy({
        by: ["source"],
        where: { status: "Won" },
        _count: { _all: true },
      }),
      prisma.car.findMany({ where: { status: { not: "Sold" } } }),
      prisma.accessory.findMany({
        include: { _count: { select: { items: true } } },
      }),
    ]);

  // Revenue split (gross line revenue this month).
  let carsRev = 0;
  let accRev = 0;
  for (const inv of monthInvoices) {
    for (const item of inv.items) {
      const line = item.price * item.qty;
      if (item.kind === "car") carsRev += line;
      else accRev += line;
    }
  }

  // Sales by staff (this month, by invoice total).
  const staffMap = new Map<string, { count: number; revenue: number }>();
  for (const inv of monthInvoices) {
    const key = inv.staff?.trim() || "Unassigned";
    const cur = staffMap.get(key) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += inv.total;
    staffMap.set(key, cur);
  }
  const salesByStaff = Array.from(staffMap.entries())
    .map(([staff, v]) => ({ staff, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // Leads by source with conversion %.
  const wonMap = new Map<string, number>();
  wonBySourceRaw.forEach((g) => wonMap.set(g.source, g._count._all));
  const leadsBySource = leadsBySourceRaw
    .map((g) => {
      const total = g._count._all;
      const won = wonMap.get(g.source) ?? 0;
      return {
        source: g.source,
        total,
        won,
        conversion: total > 0 ? Math.round((won / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  // Dead stock: unsold cars older than the threshold.
  const deadStockCars = cars
    .map((c) => ({
      id: c.id,
      make: c.make,
      model: c.model,
      year: c.year,
      daysInStock: daysSince(c.addedDate),
      askingPrice: c.askingPrice,
    }))
    .filter((c) => c.daysInStock >= DEAD_STOCK_DAYS)
    .sort((a, b) => b.daysInStock - a.daysInStock);

  // Accessories that have never sold.
  const slowAccessories = accessories
    .filter((a) => a._count.items === 0)
    .map((a) => ({ id: a.id, name: a.name, sku: a.sku, qty: a.qty }))
    .sort((a, b) => b.qty - a.qty);

  return {
    revenueSplit: { cars: carsRev, accessories: accRev },
    salesByStaff,
    leadsBySource,
    deadStockCars,
    slowAccessories,
    month: new Date().toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    }),
  };
}
