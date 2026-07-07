import { prisma } from "@/lib/prisma";
import { ok, parseBody, handle } from "@/lib/api";
import { leadSchema } from "@/lib/schemas";
import { sendMail } from "@/lib/email";
import { composeLeadAutoReply } from "@/lib/lead-autoreply";

export const dynamic = "force-dynamic";

// This endpoint is called cross-origin by the public marketing website's
// enquiry form, so it must answer CORS preflight and echo the headers.
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  return handle(async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const q = searchParams.get("q")?.trim();

    const leads = await prisma.lead.findMany({
      where: {
        status: status || undefined,
        source: source || undefined,
        OR: q
          ? [
              { name: { contains: q } },
              { phone: { contains: q } },
              { interestedIn: { contains: q } },
            ]
          : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(leads);
  });
}

export async function POST(req: Request) {
  const res = await handle(async () => {
    const parsed = await parseBody(req, leadSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        name: v.name,
        phone: v.phone,
        interestedIn: v.interestedIn,
        source: v.source,
        status: v.status,
        followUpDate: v.followUpDate ? new Date(v.followUpDate) : null,
        staff: v.staff,
        notes: v.notes,
      },
    });

    // Auto-create/update a customer record (fill in the email if we got one).
    await prisma.customer.upsert({
      where: { phone: v.phone },
      update: v.email ? { email: v.email } : {},
      create: { name: v.name, phone: v.phone, email: v.email ?? null },
    });

    // Confirmation email to the customer — only when they gave an email AND
    // picked an accessory we genuinely have in stock. Never fails the lead.
    if (v.email && v.accessory) {
      try {
        const acc = await prisma.accessory.findFirst({
          where: { name: v.accessory, qty: { gt: 0 } },
          select: { name: true },
        });
        if (acc) {
          const { subject, text } = composeLeadAutoReply({
            customerName: v.name,
            accessory: acc.name,
          });
          await sendMail({ to: v.email, subject, text });
        }
      } catch (e) {
        console.error("[leads] auto-reply email failed:", e);
      }
    }

    return ok(lead, 201);
  });

  // Attach CORS headers so browser POSTs from the website succeed.
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.headers.set(key, value);
  }
  return res;
}
