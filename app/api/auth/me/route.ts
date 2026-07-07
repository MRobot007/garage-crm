import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_SECRET, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Returns the currently logged-in user (or 401). Used by the client to show
// who's signed in and to hide nav items the role can't access.
export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, AUTH_SECRET);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, name: true, username: true, role: true, active: true },
  });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ data: user });
}
