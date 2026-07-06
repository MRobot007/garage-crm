import { prisma } from "@/lib/prisma";
import { ok, handle } from "@/lib/api";
import { serializeCustomer } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    const customers = await prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : undefined,
      include: {
        invoices: { select: { total: true, carId: true, date: true } },
      },
      orderBy: { name: "asc" },
    });
    return ok(customers.map(serializeCustomer));
  });
}
