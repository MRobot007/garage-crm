import { prisma } from "@/lib/prisma";
import { ok, handle } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SearchHit {
  type: "lead" | "car" | "customer" | "invoice";
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function GET(req: Request) {
  return handle(async () => {
    const q = new URL(req.url).searchParams.get("q")?.trim();
    if (!q || q.length < 2) return ok<SearchHit[]>([]);

    const like = { contains: q };

    const [leads, cars, customers, invoices] = await Promise.all([
      prisma.lead.findMany({
        where: { OR: [{ name: like }, { phone: { contains: q } }] },
        take: 4,
      }),
      prisma.car.findMany({
        where: {
          OR: [{ make: like }, { model: like }, { regNo: like }],
        },
        take: 4,
      }),
      prisma.customer.findMany({
        where: { OR: [{ name: like }, { phone: { contains: q } }] },
        take: 4,
      }),
      prisma.invoice.findMany({
        where: { invoiceNo: like },
        include: { customer: { select: { name: true } } },
        take: 4,
      }),
    ]);

    const hits: SearchHit[] = [
      ...leads.map((l) => ({
        type: "lead" as const,
        id: l.id,
        title: l.name,
        subtitle: `${l.phone} · ${l.status}`,
        href: "/leads",
      })),
      ...cars.map((c) => ({
        type: "car" as const,
        id: c.id,
        title: `${c.make} ${c.model} ${c.year}`,
        subtitle: `${c.regNo} · ${formatMoney(c.askingPrice)}`,
        href: `/cars/${c.id}`,
      })),
      ...customers.map((c) => ({
        type: "customer" as const,
        id: c.id,
        title: c.name,
        subtitle: c.phone,
        href: `/customers/${c.id}`,
      })),
      ...invoices.map((i) => ({
        type: "invoice" as const,
        id: i.id,
        title: i.invoiceNo,
        subtitle: `${i.customer?.name ?? "—"} · ${formatMoney(i.total)}`,
        href: `/invoices/${i.id}`,
      })),
    ];

    return ok(hits);
  });
}
