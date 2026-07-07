// Tiny CSV helpers (server-side). Values are escaped per RFC 4180.

export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => r.map(esc).join(",")),
  ];
  // Prepend a BOM so Excel opens UTF-8 correctly.
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
