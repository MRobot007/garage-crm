import { NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { buildReports } from "@/lib/reports";
import { reportsToCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

// CSV of the monthly business snapshot. Owner + manager only
// (also enforced in middleware, which gates all of /api/reports).
export async function GET() {
  const session = await currentSession();
  if (!session || session.role === "staff") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const data = await buildReports();
  const csv = reportsToCsv(data);
  const month = data.month.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vozidex-report-${month}.csv"`,
    },
  });
}
