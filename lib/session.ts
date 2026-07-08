import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_SECRET,
  SESSION_COOKIE,
  verifySessionToken,
  type Role,
  type Session,
} from "./auth";

/** Read + verify the current user's session inside a route handler. */
export async function currentSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, AUTH_SECRET);
}

/**
 * Defense-in-depth role gate for sensitive route handlers. Returns a 401/403
 * response to short-circuit with, or null when the caller is allowed. Use in
 * addition to middleware, never instead of it.
 */
export async function guardRole(allowed: Role[]): Promise<NextResponse | null> {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!allowed.includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
