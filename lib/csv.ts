// Tiny CSV helpers (server-side). Values are escaped per RFC 4180.

import type { ReportsData } from "@/lib/types";

type Cell = string | number | null | undefined;

/** Escape a single CSV cell (RFC 4180). */
export function csvEscape(v: Cell): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Array<Cell[]>): string {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  // Prepend a BOM so Excel opens UTF-8 correctly.
  return "﻿" + lines.join("\r\n");
}

/** Multi-section CSV of the monthly business snapshot (Reports page). */
export function reportsToCsv(data: ReportsData): string {
  const lines: string[] = [];
  const row = (...cells: Cell[]) => lines.push(cells.map(csvEscape).join(","));
  const gap = () => lines.push("");

  row("VOZIDEX — Business Snapshot", data.month);
  gap();

  row("Revenue Split", "Amount");
  row("Vehicles", data.revenueSplit.cars);
  row("Accessories", data.revenueSplit.accessories);
  row("Total", data.revenueSplit.cars + data.revenueSplit.accessories);
  gap();

  row("Sales by Staff");
  row("Staff", "Sales", "Revenue");
  data.salesByStaff.forEach((s) => row(s.staff, s.count, s.revenue));
  gap();

  row("Leads by Source");
  row("Source", "Leads", "Won", "Conversion %");
  data.leadsBySource.forEach((s) => row(s.source, s.total, s.won, s.conversion));
  gap();

  row("Dead Stock — cars aging beyond threshold");
  row("Vehicle", "Year", "Asking Price", "Days In Stock");
  data.deadStockCars.forEach((c) =>
    row(`${c.make} ${c.model}`, c.year, c.askingPrice, c.daysInStock),
  );
  gap();

  row("Accessories Never Sold");
  row("Name", "SKU", "In Stock");
  data.slowAccessories.forEach((a) => row(a.name, a.sku, a.qty));

  return "﻿" + lines.join("\r\n");
}

/** Build a sales CSV from invoices (must include customer, car, items). */
export function salesToCsv(invoices: any[]): string {
  const headers = [
    "Invoice No",
    "Date",
    "Customer",
    "Phone",
    "Vehicle",
    "Accessories",
    "Subtotal",
    "Discount",
    "Tax %",
    "Tax",
    "Total",
    "Received",
    "Balance",
    "Status",
    "Sold by",
  ];
  const rows = invoices.map((inv) => {
    const car = inv.car ? `${inv.car.make} ${inv.car.model} ${inv.car.year}` : "";
    const acc = (inv.items ?? [])
      .filter((i: any) => i.kind === "accessory")
      .map((i: any) => `${i.qty}x ${i.name}`)
      .join("; ");
    const date = new Date(inv.date).toISOString().slice(0, 10);
    return [
      inv.invoiceNo,
      date,
      inv.customer?.name ?? "",
      inv.customer?.phone ?? "",
      car,
      acc,
      inv.subtotal,
      inv.discount,
      inv.gstPercent,
      inv.gst,
      inv.total,
      inv.received,
      Math.max(0, inv.total - inv.received),
      inv.status,
      inv.staff ?? "",
    ];
  });
  return toCsv(headers, rows);
}
