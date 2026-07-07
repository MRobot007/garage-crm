import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { orderSchema } from "@/lib/schemas";
import { serializeOrder } from "@/lib/serialize";
import { sendMail, isEmailConfigured } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ORDER_INCLUDE = {
  supplier: { select: { id: true, name: true, email: true } },
  items: true,
} satisfies Prisma.PurchaseOrderInclude;

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.trim();
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: supplierId || undefined,
        status: status || undefined,
        OR: q
          ? [
              { orderNo: { contains: q } },
              { supplier: { name: { contains: q } } },
            ]
          : undefined,
      },
      include: ORDER_INCLUDE,
      orderBy: { date: "desc" },
    });
    return ok(orders.map(serializeOrder));
  });
}

function nextOrderNo(lastNo: string | undefined): string {
  const n = lastNo ? parseInt(lastNo.replace(/\D/g, ""), 10) || 0 : 0;
  return `PO-${String(n + 1).padStart(4, "0")}`;
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBody(req, orderSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const supplier = await prisma.supplier.findUnique({
      where: { id: v.supplierId },
    });
    if (!supplier) return fail("Supplier not found", 404);

    const last = await prisma.purchaseOrder.findFirst({
      orderBy: { orderNo: "desc" },
      select: { orderNo: true },
    });
    const orderNo = nextOrderNo(last?.orderNo);

    // Attempt to send by email only if requested and the supplier has one.
    let emailResult: { sent: boolean; skipped?: boolean; error?: string } = {
      sent: false,
      skipped: true,
    };
    if (v.send && supplier.email) {
      emailResult = await sendMail({
        to: supplier.email,
        subject: v.subject,
        text: v.body,
      });
    }

    const status = emailResult.sent ? "Sent" : "Draft";
    const emailedVia = emailResult.sent ? "smtp" : null;

    const order = await prisma.purchaseOrder.create({
      data: {
        orderNo,
        supplierId: supplier.id,
        status,
        emailTo: supplier.email,
        subject: v.subject,
        body: v.body,
        emailedVia,
        notes: v.notes,
        items: {
          create: v.items.map((it) => ({
            kind: it.kind,
            accessoryId: it.accessoryId ?? null,
            name: it.name,
            qty: it.qty,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    await logAudit({
      action: "ordered",
      entity: "order",
      entityId: order.id,
      summary: `Purchase order ${order.orderNo} to ${supplier.name}: ${v.items
        .map((i) => `${i.qty}× ${i.name}`)
        .join(", ")}${emailResult.sent ? " (emailed)" : ""}`,
    });

    return ok(
      {
        order: serializeOrder(order),
        email: {
          sent: emailResult.sent,
          // Client should open a mailto: fallback when we didn't actually send.
          fallbackToMailto:
            v.send && !emailResult.sent && Boolean(supplier.email),
          supplierHasEmail: Boolean(supplier.email),
          smtpConfigured: isEmailConfigured(),
          error: emailResult.error,
        },
      },
      201,
    );
  });
}
