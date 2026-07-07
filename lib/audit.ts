import { prisma } from "./prisma";
import { currentSession } from "./session";

export interface Actor {
  uid?: string | null;
  name?: string;
  role?: string;
}

/**
 * Record an action in the audit trail. Best-effort: never throws, so it can't
 * break the operation being logged. If `actor` is omitted, the current logged-in
 * user is used (falls back to "System").
 */
export async function logAudit(entry: {
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  actor?: Actor | null;
}): Promise<void> {
  try {
    let actor = entry.actor;
    if (actor === undefined) {
      const s = await currentSession();
      actor = s ? { uid: s.uid, name: s.name, role: s.role } : null;
    }
    await prisma.auditLog.create({
      data: {
        userId: actor?.uid ?? null,
        userName: actor?.name || "System",
        role: actor?.role || "system",
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
      },
    });
  } catch (e) {
    console.error("[audit] failed to log:", e);
  }
}
