import { prisma } from "@/lib/prisma";
import { ok, fail, handle } from "@/lib/api";
import { serializeCustomer } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          include: {
            items: true,
            car: { select: { id: true, make: true, model: true, year: true } },
            customer: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { date: "desc" },
        },
      },
    });
    if (!customer) return fail("Customer not found", 404);

    // Attach the full invoice list to the serialized shape.
    return ok(
      serializeCustomer({ ...customer, includeInvoices: true }),
    );
  });
}
