import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Cookieless client used only to send the password-recovery email.
 *
 * `createServerClient` hard-codes `flowType: "pkce"`, which makes Supabase mint
 * a `pkce_`-prefixed recovery token. Such a token can only be redeemed by
 * exchanging it for a session against the code-verifier cookie held by the one
 * browser that asked for the reset -- so a link read on a phone after being
 * requested on a laptop can never work, and asking twice invalidates the first
 * email's link.
 *
 * Sending the request through a plain client leaves the code challenge off, so
 * Supabase stores an ordinary token hash that `verifyOtp` can redeem on the
 * server. No cookie has to survive, and the link works wherever it is opened.
 *
 * Nothing here is ever signed in: `POST /recover` takes the anon key alone.
 */
export function createRecoveryClient() {
  return createClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: {
      flowType: "implicit",
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
