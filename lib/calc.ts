// Invoice math — used both for the live client-side preview and as the
// authoritative server-side computation. Keep one source of truth.

export interface LineLike {
  qty: number;
  price: number; // unit price in Kč (CZK)
}

export interface InvoiceTotals {
  itemsSubtotal: number; // accessory lines
  carAmount: number;
  subtotal: number; // items + car, before discount
  discount: number;
  taxable: number; // subtotal - discount (floored at 0)
  gst: number;
  total: number;
  received: number;
  balance: number;
  status: "Paid" | "Partial" | "Pending";
}

export function computeTotals(params: {
  items: LineLike[];
  carPrice?: number | null;
  discount?: number | null;
  gstPercent?: number | null;
  received?: number | null;
}): InvoiceTotals {
  const items = params.items ?? [];
  const carAmount = Math.max(0, Math.round(params.carPrice ?? 0));
  const itemsSubtotal = items.reduce(
    (sum, it) => sum + Math.max(0, Math.round(it.qty)) * Math.max(0, Math.round(it.price)),
    0,
  );
  const subtotal = itemsSubtotal + carAmount;

  const discount = Math.min(
    Math.max(0, Math.round(params.discount ?? 0)),
    subtotal,
  );
  const taxable = Math.max(0, subtotal - discount);
  const gstPercent = Math.max(0, params.gstPercent ?? 0);
  const gst = Math.round((taxable * gstPercent) / 100);
  const total = taxable + gst;

  const received = Math.max(0, Math.round(params.received ?? 0));
  const balance = Math.max(0, total - received);

  let status: InvoiceTotals["status"] = "Pending";
  if (received >= total && total > 0) status = "Paid";
  else if (received > 0) status = "Partial";

  return {
    itemsSubtotal,
    carAmount,
    subtotal,
    discount,
    taxable,
    gst,
    total,
    received,
    balance,
    status,
  };
}
