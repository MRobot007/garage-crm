// Map Prisma rows → client JSON shapes, adding computed fields.
import type { Car, Accessory, Invoice, Customer } from "./types";
import { daysSince } from "./utils";

type Iso = (d: Date | null) => string | null;
const iso: Iso = (d) => (d ? d.toISOString() : null);

export function serializeCar(c: any): Car {
  return {
    id: c.id,
    make: c.make,
    model: c.model,
    year: c.year,
    type: c.type,
    regNo: c.regNo,
    km: c.km,
    costPrice: c.costPrice,
    askingPrice: c.askingPrice,
    status: c.status,
    addedDate: c.addedDate.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    margin: c.askingPrice - c.costPrice,
    daysInStock: daysSince(c.addedDate),
    invoice: c.invoice
      ? { id: c.invoice.id, invoiceNo: c.invoice.invoiceNo }
      : null,
  };
}

export function serializeAccessory(a: any): Accessory {
  return {
    id: a.id,
    name: a.name,
    sku: a.sku,
    category: a.category,
    qty: a.qty,
    costPrice: a.costPrice,
    sellPrice: a.sellPrice,
    reorderLevel: a.reorderLevel,
    supplier: a.supplier ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    lowStock: a.qty <= a.reorderLevel,
  };
}

export function serializeInvoice(i: any): Invoice {
  return {
    id: i.id,
    invoiceNo: i.invoiceNo,
    customerId: i.customerId,
    customer: i.customer
      ? { id: i.customer.id, name: i.customer.name, phone: i.customer.phone }
      : null,
    carId: i.carId ?? null,
    car: i.car
      ? { id: i.car.id, make: i.car.make, model: i.car.model, year: i.car.year }
      : null,
    date: i.date.toISOString(),
    discount: i.discount,
    gstPercent: i.gstPercent,
    subtotal: i.subtotal,
    gst: i.gst,
    total: i.total,
    received: i.received,
    balance: Math.max(0, i.total - i.received),
    status: i.status,
    staff: i.staff ?? null,
    notes: i.notes ?? null,
    items: (i.items ?? []).map((it: any) => ({
      id: it.id,
      invoiceId: it.invoiceId,
      accessoryId: it.accessoryId ?? null,
      kind: it.kind,
      name: it.name,
      qty: it.qty,
      price: it.price,
    })),
  };
}

export function serializeCustomer(c: any): Customer {
  const invoices = c.invoices ?? [];
  const totalSpent = invoices.reduce((s: number, inv: any) => s + inv.total, 0);
  const carsPurchased = invoices.filter((inv: any) => inv.carId).length;
  const lastPurchase =
    invoices.length > 0
      ? invoices
          .map((inv: any) => inv.date)
          .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0]
      : null;
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    carsPurchased,
    totalSpent,
    lastPurchase: iso(lastPurchase),
    invoices: c.includeInvoices ? invoices.map(serializeInvoice) : undefined,
  };
}
