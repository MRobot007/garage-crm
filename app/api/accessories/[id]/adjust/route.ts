import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { adjustStockSchema } from "@/lib/schemas";
import { serializeAccessory } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const parsed = await parseBody(req, adjustStockSchema);
    if (!parsed.success) return parsed.response;
    const { delta } = parsed.data;

    const existing = await prisma.accessory.findUnique({
      where: { id: params.id },
    });
    if (!existing) return fail("Accessory not found", 404);

    const nextQty = Math.max(0, existing.qty + delta);
    const acc = await prisma.accessory.update({
      where: { id: params.id },
      data: { qty: nextQty },
    });
    return ok(serializeAccessory(acc));
  });
}
