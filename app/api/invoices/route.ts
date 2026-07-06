import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { invoiceSchema } from "@/lib/schemas";
import { serializeInvoice } from "@/lib/serialize";
import { computeTotals } from "@/lib/calc";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const INVOICE_INCLUDE = {
  customer: { select: { id: true, name: true, phone: true } },
  car: { select: { id: true, make: true, model: true, year: true } },
  items: true,
} satisfies Prisma.InvoiceInclude;

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const invoices = await prisma.invoice.findMany({
      where: { status: status || undefined },
      include: INVOICE_INCLUDE,
      orderBy: { date: "desc" },
    });
    return ok(invoices.map(serializeInvoice));
  });
}

function nextInvoiceNo(lastNo: string | undefined): string {
  const n = lastNo ? parseInt(lastNo.replace(/\D/g, ""), 10) || 0 : 0;
  return `INV-${String(n + 1).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBody(req, invoiceSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    try {
      const invoice = await prisma.$transaction(async (tx) => {
        // 1) Resolve customer (existing id, or upsert by phone).
        let customerId = v.customerId;
        if (!customerId) {
          const customer = await tx.customer.upsert({
            where: { phone: v.customerPhone! },
            update: {
              name: v.customerName!,
              ...(v.customerEmail ? { email: v.customerEmail } : {}),
            },
            create: {
              name: v.customerName!,
              phone: v.customerPhone!,
              email: v.customerEmail ?? null,
            },
          });
          customerId = customer.id;
        }

        // 2) Validate car (if any).
        let carLinePrice = 0;
        let carLineName = "";
        if (v.carId) {
          const car = await tx.car.findUnique({ where: { id: v.carId } });
          if (!car) throw new HttpError("Selected car not found", 404);
          if (car.status === "Sold") {
            throw new HttpError("That car is already sold", 409);
          }
          const linked = await tx.invoice.findUnique({
            where: { carId: v.carId },
          });
          if (linked) throw new HttpError("That car is already invoiced", 409);
          carLinePrice = car.askingPrice;
          carLineName = `${car.make} ${car.model} ${car.year}`;
        }

        // 3) Validate accessory lines and check stock.
        const lineData: {
          kind: string;
          accessoryId: string | null;
          name: string;
          qty: number;
          price: number;
        }[] = [];

        for (const item of v.items) {
          const acc = await tx.accessory.findUnique({
            where: { id: item.accessoryId },
          });
          if (!acc) throw new HttpError(`Accessory not found: ${item.name}`, 404);
          if (acc.qty < item.qty) {
            throw new HttpError(
              `Not enough stock for ${acc.name} (have ${acc.qty}, need ${item.qty})`,
              409,
            );
          }
          lineData.push({
            kind: "accessory",
            accessoryId: acc.id,
            name: acc.name,
            qty: item.qty,
            price: item.price,
          });
        }

        // 4) Compute authoritative totals.
        const totals = computeTotals({
          items: lineData.map((l) => ({ qty: l.qty, price: l.price })),
          carPrice: carLinePrice,
          discount: v.discount,
          gstPercent: v.gstPercent,
          received: v.received,
        });

        // 5) Invoice number.
        const last = await tx.invoice.findFirst({
          orderBy: { invoiceNo: "desc" },
          select: { invoiceNo: true },
        });
        const invoiceNo = nextInvoiceNo(last?.invoiceNo);

        // 6) Create invoice + all line items.
        const created = await tx.invoice.create({
          data: {
            invoiceNo,
            customerId,
            carId: v.carId ?? null,
            discount: totals.discount,
            gstPercent: v.gstPercent,
            subtotal: totals.subtotal,
            gst: totals.gst,
            total: totals.total,
            received: v.received,
            status: totals.status,
            staff: v.staff,
            notes: v.notes,
            items: {
              create: [
                ...(v.carId
                  ? [
                      {
                        kind: "car",
                        name: carLineName,
                        qty: 1,
                        price: carLinePrice,
                      },
                    ]
                  : []),
                ...lineData,
              ],
            },
          },
          include: INVOICE_INCLUDE,
        });

        // 7) Mark car sold.
        if (v.carId) {
          await tx.car.update({
            where: { id: v.carId },
            data: { status: "Sold" },
          });
        }

        // 8) Decrement accessory stock.
        for (const line of lineData) {
          if (line.accessoryId) {
            await tx.accessory.update({
              where: { id: line.accessoryId },
              data: { qty: { decrement: line.qty } },
            });
          }
        }

        return created;
      });

      return ok(serializeInvoice(invoice), 201);
    } catch (e) {
      if (e instanceof HttpError) return fail(e.message, e.status);
      throw e;
    }
  });
}

class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
