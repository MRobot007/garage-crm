import { NextResponse } from "next/server";
import {
  AUTH_SECRET,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
  passwordMatches,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    /* ignore — treated as empty */
  }

  if (!password || !passwordMatches(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const token = await createSessionToken(AUTH_SECRET);
  const res = NextResponse.json({ data: { ok: true } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
