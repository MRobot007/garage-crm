import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { supplierSchema } from "@/lib/schemas";
import { serializeSupplier } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const patchSchema = supplierSchema.partial();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          include: {
            items: true,
            supplier: { select: { id: true, name: true, email: true } },
          },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!supplier) return fail("Supplier not found", 404);
    return ok(serializeSupplier({ ...supplier, includeOrders: true }));
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const parsed = await parseBody(req, patchSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const existing = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Supplier not found", 404);

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        ...(v.name !== undefined && { name: v.name }),
        ...(v.email !== undefined && { email: v.email ?? null }),
        ...(v.phone !== undefined && { phone: v.phone ?? null }),
        ...(v.notes !== undefined && { notes: v.notes ?? null }),
      },
      include: { _count: { select: { orders: true } } },
    });
    return ok(serializeSupplier(supplier));
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const existing = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Supplier not found", 404);
    // Orders (and their items) cascade-delete with the supplier.
    await prisma.supplier.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  });
}
