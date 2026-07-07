import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { serializeInvoice } from "@/lib/serialize";
import { logAudit } from "@/lib/audit";
import { formatMoney } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const INVOICE_INCLUDE = {
  customer: { select: { id: true, name: true, phone: true } },
  car: { select: { id: true, make: true, model: true, year: true } },
  items: true,
} satisfies Prisma.InvoiceInclude;

// Record an additional/updated payment amount.
const paymentSchema = z.object({
  received: z.coerce.number().int().min(0),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) return fail("Invoice not found", 404);
    return ok(serializeInvoice(invoice));
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const parsed = await parseBody(req, paymentSchema);
    if (!parsed.success) return parsed.response;
    const { received } = parsed.data;

    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail("Invoice not found", 404);

    const status =
      received >= existing.total && existing.total > 0
        ? "Paid"
        : received > 0
          ? "Partial"
          : "Pending";

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: { received, status },
      include: INVOICE_INCLUDE,
    });
    await logAudit({
      action: "payment",
      entity: "invoice",
      entityId: invoice.id,
      summary: `Payment on ${invoice.invoiceNo}: received ${formatMoney(received)} (${status})`,
    });
    return ok(serializeInvoice(invoice));
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!invoice) return fail("Invoice not found", 404);

    await prisma.$transaction(async (tx) => {
      // Restore car to Available.
      if (invoice.carId) {
        await tx.car.update({
          where: { id: invoice.carId },
          data: { status: "Available" },
        });
      }
      // Restore accessory stock.
      for (const item of invoice.items) {
        if (item.accessoryId) {
          await tx.accessory.update({
            where: { id: item.accessoryId },
            data: { qty: { increment: item.qty } },
          });
        }
      }
      // Items cascade-delete with the invoice.
      await tx.invoice.delete({ where: { id: params.id } });
    });

    await logAudit({
      action: "deleted",
      entity: "invoice",
      entityId: params.id,
      summary: `Deleted invoice ${invoice.invoiceNo}`,
    });
    return ok({ id: params.id });
  });
}
