import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Stateless public client for the QR/NFC redirect endpoint.
 *
 * It holds only the browser-safe anon key. The database exposes one narrow RPC
 * for exact slug resolution, so the Vercel runtime no longer needs a key that
 * bypasses Row Level Security.
 */
export function createPublicClient() {
  return createClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
