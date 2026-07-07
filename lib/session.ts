import { cookies } from "next/headers";
import {
  AUTH_SECRET,
  SESSION_COOKIE,
  verifySessionToken,
  type Session,
} from "./auth";

/** Read + verify the current user's session inside a route handler. */
export async function currentSession(): Promise<Session | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, AUTH_SECRET);
}
