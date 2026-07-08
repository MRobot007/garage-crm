import { prisma } from "@/lib/prisma";
import { ok, parseBody, handle } from "@/lib/api";
import { guardRole } from "@/lib/session";
import { settingsSchema } from "@/lib/schemas";
import type { Settings } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULTS: Settings = {
  businessName: "VOZIDEX",
  currency: "$",
  gstPercent: 8,
};

async function getOrCreate() {
  const existing = await prisma.setting.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.setting.create({ data: { id: "default", ...DEFAULTS } });
}

export async function GET() {
  return handle(async () => {
    const s = await getOrCreate();
    return ok<Settings>({
      businessName: s.businessName,
      currency: s.currency,
      gstPercent: s.gstPercent,
    });
  });
}

export async function PATCH(req: Request) {
  const denied = await guardRole(["owner"]);
  if (denied) return denied;
  return handle(async () => {
    const parsed = await parseBody(req, settingsSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const s = await prisma.setting.upsert({
      where: { id: "default" },
      update: v,
      create: { id: "default", ...v },
    });
    return ok<Settings>({
      businessName: s.businessName,
      currency: s.currency,
      gstPercent: s.gstPercent,
    });
  });
}
