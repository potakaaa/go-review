import {
  inactiveResponse,
  lookupErrorResponse,
  notFoundResponse,
} from "@/lib/branded-response";
import { createPublicClient } from "@/lib/supabase/public";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/slug";

/**
 * The public endpoint every printed QR code and NFC tag points at.
 *
 * This is the only route a paying customer's customer ever hits, so it does the
 * minimum possible work: one indexed lookup, then a redirect. Nothing here may
 * depend on a session, and nothing may block the response.
 */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/r/[slug]">,
): Promise<Response> {
  const { slug } = await ctx.params;

  // Reject anything that could not be a real slug before touching the database.
  // Cheap, and it keeps scanner noise and probe traffic off the connection pool.
  if (!slug || slug.length > SLUG_MAX_LENGTH || !SLUG_PATTERN.test(slug)) {
    return notFoundResponse();
  }

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .rpc("resolve_redirect", { p_slug: slug });

  if (error) {
    console.error("[redirect] lookup_failed", { slug });
    return lookupErrorResponse();
  }

  const resolved = data?.[0];
  if (!resolved) return notFoundResponse();
  if (resolved.route_state === "inactive") return inactiveResponse();
  if (!resolved.destination_url) return lookupErrorResponse();

  return new Response(null, {
    // 302, never 301: browsers cache permanent redirects indefinitely, which
    // would freeze a printed card to whatever destination it had on the day it
    // was first scanned. Re-pointing cards is the entire product.
    status: 302,
    headers: {
      location: resolved.destination_url,
      "cache-control": "no-store, no-cache, must-revalidate",
      "content-security-policy":
        "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "x-frame-options": "DENY",
    },
  });
}
