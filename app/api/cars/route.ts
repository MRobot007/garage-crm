import { prisma } from "@/lib/prisma";
import { ok, parseBody, handle } from "@/lib/api";
import { carSchema } from "@/lib/schemas";
import { serializeCar } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();

    const cars = await prisma.car.findMany({
      where: {
        status: status || undefined,
        type: type || undefined,
        OR: q
          ? [
              { make: { contains: q } },
              { model: { contains: q } },
              { regNo: { contains: q } },
            ]
          : undefined,
      },
      include: { invoice: { select: { id: true, invoiceNo: true } } },
      orderBy: { addedDate: "desc" },
    });
    return ok(cars.map(serializeCar));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBody(req, carSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;
    const car = await prisma.car.create({ data: { ...v, regNo: v.regNo.toUpperCase() } });
    return ok(serializeCar(car), 201);
  });
}
