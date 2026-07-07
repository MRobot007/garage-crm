import { prisma } from "@/lib/prisma";
import { ok, handle } from "@/lib/api";

export const dynamic = "force-dynamic";

// Owner + manager only (enforced in middleware). Most recent 300 entries.
export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const entity = searchParams.get("entity");

    const logs = await prisma.auditLog.findMany({
      where: {
        entity: entity && entity !== "all" ? entity : undefined,
        OR: q
          ? [{ userName: { contains: q } }, { summary: { contains: q } }]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return ok(
      logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    );
  });
}
