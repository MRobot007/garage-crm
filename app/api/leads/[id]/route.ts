import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { leadSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

// Partial update — allows status-only PATCH from the pipeline.
const patchSchema = leadSchema.partial();

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const parsed = await parseBody(req, patchSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Lead not found", 404);

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(v.name !== undefined && { name: v.name }),
        ...(v.phone !== undefined && { phone: v.phone }),
        ...(v.email !== undefined && { email: v.email }),
        ...(v.interestedIn !== undefined && { interestedIn: v.interestedIn }),
        ...(v.source !== undefined && { source: v.source }),
        ...(v.status !== undefined && { status: v.status }),
        ...(v.followUpDate !== undefined && {
          followUpDate: v.followUpDate ? new Date(v.followUpDate) : null,
        }),
        ...(v.staff !== undefined && { staff: v.staff }),
        ...(v.notes !== undefined && { notes: v.notes }),
      },
    });
    return ok(lead);
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  return handle(async () => {
    const existing = await prisma.lead.findUnique({ where: { id: params.id } });
    if (!existing) return fail("Lead not found", 404);
    await prisma.lead.delete({ where: { id: params.id } });
    return ok({ id: params.id });
  });
}
