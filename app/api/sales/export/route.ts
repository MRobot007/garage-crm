import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentSession } from "@/lib/session";
import { salesToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// CSV of ALL sales. Owner + manager only (also enforced in middleware).
export async function GET() {
  const session = await currentSession();
  if (!session || session.role === "staff") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const invoices = await prisma.invoice.findMany({
    include: { customer: true, car: true, items: true },
    orderBy: { date: "desc" },
  });

  const csv = salesToCsv(invoices);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vozidex-all-sales.csv"`,
    },
  });
}
