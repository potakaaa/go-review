import "server-only";

import type { User } from "@supabase/supabase-js";

import type { ServerSupabaseClient } from "@/lib/auth";

export type ResetSession = {
  user: User;
  /**
   * The authenticator this session must still be verified with. Supabase
   * refuses a password change from an `aal1` session once the account has a
   * verified factor (`insufficient_aal`), and a recovery link only ever proves
   * the inbox -- so an enrolled account gives its code on the same form.
   */
  stepUpFactorId?: string;
};

export async function readResetSession(
  supabase: ServerSupabaseClient,
): Promise<ResetSession | null> {
  // Sequential on purpose: both may refresh an expired session, and two
  // concurrent refreshes would spend the same single-use refresh token.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: claimsData } = await supabase.auth.getClaims();

  const factor = user.factors?.find(
    (candidate) =>
      candidate.factor_type === "totp" && candidate.status === "verified",
  );
  return {
    user,
    stepUpFactorId:
      factor && claimsData?.claims.aal !== "aal2" ? factor.id : undefined,
  };
}
