import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public, read-only list of in-stock accessories for the marketing website's
// enquiry form. Only exposes id + name + category (no cost/stock numbers).
const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    const accessories = await prisma.accessory.findMany({
      where: { qty: { gt: 0 } },
      select: { id: true, name: true, category: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: accessories }, { headers: CORS });
  } catch (e) {
    console.error("[public/accessories] error:", e);
    return NextResponse.json(
      { error: "Failed to load accessories" },
      { status: 500, headers: CORS },
    );
  }
}
