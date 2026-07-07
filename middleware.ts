import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_SECRET, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Owner-only surfaces: team management, settings changes, demo reset.
function isOwnerOnly(path: string, method: string): boolean {
  return (
    path === "/team" ||
    path.startsWith("/team/") ||
    path.startsWith("/api/users") ||
    path === "/settings" ||
    path === "/api/seed" ||
    (path === "/api/settings" && method !== "GET")
  );
}

// Manager + Owner (not staff): reports, suppliers, purchase orders, audit trail.
function isManagerUp(path: string): boolean {
  return (
    path === "/reports" ||
    path.startsWith("/api/reports") ||
    path === "/suppliers" ||
    path.startsWith("/suppliers/") ||
    path === "/purchase-orders" ||
    path.startsWith("/api/suppliers") ||
    path.startsWith("/api/orders") ||
    path === "/audit" ||
    path.startsWith("/api/audit") ||
    path.startsWith("/api/sales")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Public: website lead capture, public reads, auth endpoints, login page.
  if (
    pathname === "/api/leads" &&
    (method === "POST" || method === "OPTIONS")
  ) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/public")) return NextResponse.next();
  if (pathname.startsWith("/api/auth") || pathname === "/login") {
    return NextResponse.next();
  }

  const session = await verifySessionToken(
    req.cookies.get(SESSION_COOKIE)?.value,
    AUTH_SECRET,
  );
  const isApi = pathname.startsWith("/api/");

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const deny = () => {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  };

  const role = session.role;
  if (isOwnerOnly(pathname, method) && role !== "owner") return deny();
  if (isManagerUp(pathname) && role === "staff") return deny();
  // Staff cannot delete records.
  if (isApi && method === "DELETE" && role === "staff") return deny();

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
