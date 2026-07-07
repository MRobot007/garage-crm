import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { userUpdateSchema } from "@/lib/schemas";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

/** True if `userId` is the only active owner (so we mustn't lock everyone out). */
async function isLastActiveOwner(userId: string): Promise<boolean> {
  const owners = await prisma.user.findMany({
    where: { role: "owner", active: true },
    select: { id: true },
  });
  return owners.length === 1 && owners[0].id === userId;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const parsed = await parseBody(req, userUpdateSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) return fail("User not found", 404);

    // Don't allow the last active owner to be demoted or deactivated.
    const losingOwner =
      target.role === "owner" &&
      ((v.role !== undefined && v.role !== "owner") || v.active === false);
    if (losingOwner && (await isLastActiveOwner(target.id))) {
      return fail("You must keep at least one active owner.", 400);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(v.name !== undefined && { name: v.name }),
        ...(v.role !== undefined && { role: v.role }),
        ...(v.active !== undefined && { active: v.active }),
        ...(v.password !== undefined && {
          passwordHash: await hashPassword(v.password),
        }),
      },
      select: SELECT,
    });
    await logAudit({
      action: "updated",
      entity: "user",
      entityId: user.id,
      summary: `Updated ${user.role} "${user.name}"${v.password ? " (password reset)" : ""}${
        v.active === false ? " (deactivated)" : v.active === true ? " (activated)" : ""
      }`,
    });
    return ok({ ...user, createdAt: user.createdAt.toISOString() });
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) return fail("User not found", 404);
    if (target.role === "owner" && (await isLastActiveOwner(target.id))) {
      return fail("You can't delete the last active owner.", 400);
    }
    await prisma.user.delete({ where: { id: params.id } });
    await logAudit({
      action: "deleted",
      entity: "user",
      entityId: params.id,
      summary: `Removed ${target.role} "${target.name}" (@${target.username})`,
    });
    return ok({ id: params.id });
  });
}
