import { prisma } from "@/lib/prisma";
import { ok, handle } from "@/lib/api";
import { seedDatabase } from "@/lib/seed-core";

export const dynamic = "force-dynamic";

// POST /api/seed — reset the database to demo data (used by Settings → Reset).
export async function POST() {
  return handle(async () => {
    await seedDatabase(prisma);
    return ok({ ok: true });
  });
}
