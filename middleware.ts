import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_SECRET, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Gate the whole CRM behind a session cookie — EXCEPT:
 *  - the login page and auth endpoints
 *  - the public lead-intake `POST /api/leads` (+ its CORS preflight), which the
 *    marketing website calls cross-origin.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public: website lead capture (POST) and its preflight.
  if (
    pathname === "/api/leads" &&
    (req.method === "POST" || req.method === "OPTIONS")
  ) {
    return NextResponse.next();
  }

  // Public: auth endpoints and the login screen.
  if (pathname.startsWith("/api/auth") || pathname === "/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token, AUTH_SECRET)) {
    return NextResponse.next();
  }

  // Unauthenticated: 401 for APIs, redirect to /login for pages.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
