import { prisma } from "@/lib/prisma";
import { ok, fail, handle } from "@/lib/api";
import { currentSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// End the current user's active shift.
export async function POST() {
  return handle(async () => {
    const session = await currentSession();
    if (!session) return fail("Unauthorized", 401);

    const active = await prisma.shift.findFirst({
      where: { userId: session.uid, endedAt: null },
      orderBy: { startedAt: "desc" },
    });
    if (!active) return fail("No active shift to end.", 400);

    const shift = await prisma.shift.update({
      where: { id: active.id },
      data: { endedAt: new Date() },
    });
    await logAudit({
      action: "shift_end",
      entity: "shift",
      entityId: shift.id,
      summary: `${session.name} ended a shift`,
    });
    return ok({ id: shift.id });
  });
}
