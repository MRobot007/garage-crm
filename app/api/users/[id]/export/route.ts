import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { salesToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// CSV of one staff member's sales. Owner-only (also enforced in middleware,
// which gates all of /api/users). Matches invoices by the seller's userId, and
// falls back to the staff name to catch sales recorded before user linkage.
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await currentSession();
  if (!session || session.role !== "owner") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { name: true, username: true },
  });
  if (!user) return new NextResponse("Not found", { status: 404 });

  const invoices = await prisma.invoice.findMany({
    where: { OR: [{ userId: params.id }, { staff: user.name }] },
    include: { customer: true, car: true, items: true },
    orderBy: { date: "desc" },
  });

  const csv = salesToCsv(invoices);
  const safe = user.username.replace(/[^a-z0-9_-]/gi, "") || "staff";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vozidex-sales-${safe}.csv"`,
    },
  });
}
