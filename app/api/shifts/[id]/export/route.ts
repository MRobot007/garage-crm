import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { salesToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// CSV of the sales made during one shift. Staff may only export their own shift.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await currentSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const shift = await prisma.shift.findUnique({ where: { id: params.id } });
  if (!shift) return new NextResponse("Not found", { status: 404 });
  if (shift.userId !== session.uid && session.role === "staff") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    where: { shiftId: shift.id },
    include: { customer: true, car: true, items: true },
    orderBy: { date: "asc" },
  });

  const csv = salesToCsv(invoices);
  const date = shift.startedAt.toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shift-${date}-${shift.id.slice(0, 6)}.csv"`,
    },
  });
}
