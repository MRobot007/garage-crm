import { prisma } from "@/lib/prisma";
import { ok, parseBody, handle } from "@/lib/api";
import { accessorySchema } from "@/lib/schemas";
import { serializeAccessory } from "@/lib/serialize";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const low = searchParams.get("low");
    const q = searchParams.get("q")?.trim();

    let accessories = await prisma.accessory.findMany({
      where: {
        category: category || undefined,
        OR: q
          ? [
              { name: { contains: q } },
              { sku: { contains: q } },
              { supplier: { contains: q } },
            ]
          : undefined,
      },
      orderBy: { name: "asc" },
    });

    let result = accessories.map(serializeAccessory);
    if (low === "1") result = result.filter((a) => a.lowStock);
    return ok(result);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBody(req, accessorySchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;
    const acc = await prisma.accessory.create({
      data: { ...v, sku: v.sku.toUpperCase() },
    });
    await logAudit({
      action: "created",
      entity: "accessory",
      entityId: acc.id,
      summary: `Added accessory ${acc.name} (qty ${acc.qty})`,
    });
    return ok(serializeAccessory(acc), 201);
  });
}
