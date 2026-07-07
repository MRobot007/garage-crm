import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { orderStatusSchema } from "@/lib/schemas";
import { serializeOrder } from "@/lib/serialize";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ORDER_INCLUDE = {
  supplier: { select: { id: true, name: true, email: true } },
  items: true,
} satisfies Prisma.PurchaseOrderInclude;

// Update the order status (e.g. mark Sent after a mailto, or Received on arrival).
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const parsed = await parseBody(req, orderStatusSchema);
    if (!parsed.success) return parsed.response;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail("Order not found", 404);

    const order = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === "Sent" && existing.emailedVia == null
          ? { emailedVia: "mailto" }
          : {}),
      },
      include: ORDER_INCLUDE,
    });
    return ok(serializeOrder(order));
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail("Order not found", 404);
    await prisma.purchaseOrder.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  });
}
