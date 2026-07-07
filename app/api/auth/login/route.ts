import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  AUTH_SECRET,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  verifyPassword,
  type Role,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a username and password" },
      { status: 400 },
    );
  }
  const username = parsed.data.username.toLowerCase();

  const user = await prisma.user.findUnique({ where: { username } });
  const okPassword =
    user && user.active
      ? await verifyPassword(parsed.data.password, user.passwordHash)
      : false;
  if (!user || !user.active || !okPassword) {
    return NextResponse.json(
      { error: "Incorrect username or password" },
      { status: 401 },
    );
  }

  const token = await createSessionToken(AUTH_SECRET, {
    uid: user.id,
    role: user.role as Role,
    name: user.name,
  });
  const res = NextResponse.json({
    data: { id: user.id, name: user.name, username: user.username, role: user.role },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
