import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { accessorySchema } from "@/lib/schemas";
import { serializeAccessory } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const patchSchema = accessorySchema.partial();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const parsed = await parseBody(req, patchSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const existing = await prisma.accessory.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail("Accessory not found", 404);

    const acc = await prisma.accessory.update({
      where: { id: params.id },
      data: {
        ...v,
        ...(v.sku !== undefined && { sku: v.sku.toUpperCase() }),
      },
    });
    return ok(serializeAccessory(acc));
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const existing = await prisma.accessory.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail("Accessory not found", 404);
    // Keep referential history: detach from invoice items instead of hard-failing.
    await prisma.invoiceItem.updateMany({
      where: { accessoryId: params.id },
      data: { accessoryId: null },
    });
    await prisma.accessory.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  });
}
