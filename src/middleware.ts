/**
 * Next.js Middleware
 * Handles simple admin authentication via session token
 */

import { type NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const ADMIN_ROUTES = ["/admin"];
const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_SESSION_COOKIE = "admin_session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAdminRoute = ADMIN_ROUTES.some((route) => path.startsWith(route));
  const isLoginPage = path === ADMIN_LOGIN_PATH;

  // Allow login page access
  if (isLoginPage) {
    return NextResponse.next();
  }

  // Check admin authentication
  if (isAdminRoute) {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    // Validate session token using isAdminAuthenticated()
    // This checks if token exists in the in-memory Set
    if (!isAdminAuthenticated(sessionToken)) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and api
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
