import { after } from "next/server";

import {
  inactiveResponse,
  lookupErrorResponse,
  notFoundResponse,
} from "@/lib/branded-response";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("redirect_routes")
    .select("destination_url, active")
    .eq("slug_lower", slug.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("[redirect] lookup failed", { slug, message: error.message });
    return lookupErrorResponse();
  }

  if (!data) return notFoundResponse();
  if (!data.active) return inactiveResponse();

  // Runs after the response has been flushed, so the visitor never waits on it.
  // Unlike a bare floating promise, `after` keeps the serverless invocation
  // alive long enough for the write to land.
  after(async () => {
    try {
      await supabase.rpc("increment_scan_count", { p_slug: slug });
    } catch (cause) {
      // A dropped count is an acceptable loss; a failed redirect is not.
      console.error("[redirect] scan count failed", { slug, cause });
    }
  });

  return new Response(null, {
    // 302, never 301: browsers cache permanent redirects indefinitely, which
    // would freeze a printed card to whatever destination it had on the day it
    // was first scanned. Re-pointing cards is the entire product.
    status: 302,
    headers: {
      location: data.destination_url,
      "cache-control": "no-store, no-cache, must-revalidate",
      "referrer-policy": "no-referrer",
    },
  });
}
