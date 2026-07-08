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
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// A valid but never-matching hash, so a missing/inactive user still costs one
// full PBKDF2 verification — keeps response time constant (no username oracle).
const DUMMY_HASH =
  "hsPqQ7KZsK-Qqs49-Fqwog.ab4OI_rTbM2o96Fj58rtUByihgdhh-6hth8k8sXfSp4";

const schema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  // Throttle password guessing: 10 attempts / minute / IP.
  if (!rateLimit(`login:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }

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
  // Always run a verification (dummy hash when no active user) for constant time.
  const okPassword = await verifyPassword(
    parsed.data.password,
    user && user.active ? user.passwordHash : DUMMY_HASH,
  );
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
