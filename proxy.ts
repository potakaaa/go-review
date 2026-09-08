import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse } from "next/server";
import { isAdminHost, isPublicPath } from "@/lib/site";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const host = request.headers.get("host");
  const admin = isAdminHost(host);
  const localDevelopment =
    process.env.NODE_ENV === "development" &&
    /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host?.toLowerCase() ?? "");
  if (admin && !localDevelopment && path === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (isPublicPath(path) && (request.method === "GET" || request.method === "HEAD")) {
    const response = NextResponse.next();
    if (admin) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  if (!admin) return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
  const response = await updateSession(request);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except:
     * - /r/*        the public redirect, which must never pay for an auth
     *               round-trip and must work with no session at all
     * - _next/*     framework assets
     * - static files and metadata routes
     */
    "/((?!r/|_next/static|_next/image|favicon.ico).*)",
  ],
};
