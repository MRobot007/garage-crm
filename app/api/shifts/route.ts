import { prisma } from "@/lib/prisma";
import { ok, fail, handle } from "@/lib/api";
import { currentSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// The current user's shifts, each with its sales count + total.
export async function GET() {
  return handle(async () => {
    const session = await currentSession();
    if (!session) return fail("Unauthorized", 401);

    const shifts = await prisma.shift.findMany({
      where: { userId: session.uid },
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    const results = await Promise.all(
      shifts.map(async (s) => {
        const agg = await prisma.invoice.aggregate({
          where: { shiftId: s.id },
          _count: { _all: true },
          _sum: { total: true },
        });
        return {
          id: s.id,
          startedAt: s.startedAt.toISOString(),
          endedAt: s.endedAt ? s.endedAt.toISOString() : null,
          salesCount: agg._count._all,
          salesTotal: agg._sum.total ?? 0,
        };
      }),
    );
    return ok(results);
  });
}

// Start a shift (one active shift per user).
export async function POST() {
  return handle(async () => {
    const session = await currentSession();
    if (!session) return fail("Unauthorized", 401);

    const active = await prisma.shift.findFirst({
      where: { userId: session.uid, endedAt: null },
    });
    if (active) return fail("You already have an active shift.", 400);

    const shift = await prisma.shift.create({
      data: { userId: session.uid, userName: session.name },
    });
    await logAudit({
      action: "shift_start",
      entity: "shift",
      entityId: shift.id,
      summary: `${session.name} started a shift`,
    });
    return ok(
      {
        id: shift.id,
        startedAt: shift.startedAt.toISOString(),
        endedAt: null,
        salesCount: 0,
        salesTotal: 0,
      },
      201,
    );
  });
}
