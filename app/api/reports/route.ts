import { ok, handle } from "@/lib/api";
import { buildReports } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ok(await buildReports()));
}
