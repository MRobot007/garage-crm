import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { carBaseSchema } from "@/lib/schemas";
import { serializeCar } from "@/lib/serialize";

export const dynamic = "force-dynamic";

const patchSchema = carBaseSchema.partial();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const car = await prisma.car.findUnique({
      where: { id: params.id },
      include: { invoice: { select: { id: true, invoiceNo: true } } },
    });
    if (!car) return fail("Car not found", 404);
    return ok(serializeCar(car));
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

    const existing = await prisma.car.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Car not found", 404);

    const car = await prisma.car.update({
      where: { id: params.id },
      data: {
        ...v,
        ...(v.regNo !== undefined && { regNo: v.regNo.toUpperCase() }),
      },
      include: { invoice: { select: { id: true, invoiceNo: true } } },
    });
    return ok(serializeCar(car));
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const existing = await prisma.car.findUnique({
      where: { id: params.id },
      include: { invoice: true },
    });
    if (!existing) return fail("Car not found", 404);
    if (existing.invoice) {
      return fail(
        "This car is linked to an invoice and cannot be deleted.",
        409,
      );
    }
    await prisma.car.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  });
}
