import { prisma } from "@/lib/prisma";
import { ok, parseBody, handle } from "@/lib/api";
import { supplierSchema } from "@/lib/schemas";
import { serializeSupplier } from "@/lib/serialize";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    const suppliers = await prisma.supplier.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { orders: true } },
        orders: { select: { date: true } },
      },
      orderBy: { name: "asc" },
    });
    return ok(suppliers.map(serializeSupplier));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBody(req, supplierSchema);
    if (!parsed.success) return parsed.response;
    const supplier = await prisma.supplier.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email ?? null,
        phone: parsed.data.phone ?? null,
        notes: parsed.data.notes ?? null,
      },
      include: { _count: { select: { orders: true } } },
    });
    await logAudit({
      action: "created",
      entity: "supplier",
      entityId: supplier.id,
      summary: `Added supplier ${supplier.name}`,
    });
    return ok(serializeSupplier(supplier), 201);
  });
}
