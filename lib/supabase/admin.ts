import "server-only";

import { createClient } from "@supabase/supabase-js";

import { supabaseServiceRoleKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/**
 * Service-role client. Bypasses Row Level Security, so it is used in exactly
 * one place: the public `/r/[slug]` redirect, which must resolve a slug for a
 * visitor who has no session at all.
 *
 * The alternative -- a public SELECT policy on active routes -- would let
 * anyone enumerate every client's slug and destination. `import "server-only"`
 * makes the build fail if this file is ever pulled into a Client Component.
 */
export function createAdminClient() {
  return createClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
