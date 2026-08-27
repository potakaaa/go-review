import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
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
    "/((?!r/|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml|woff|woff2)$).*)",
  ],
};
