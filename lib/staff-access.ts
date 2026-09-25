import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

export type StaffAccessState =
  | "anonymous"
  | "unapproved"
  | "needs_password_change"
  | "needs_mfa"
  | "ready"
  | "unavailable";

export type StaffAccessRow =
  Database["public"]["Functions"]["get_my_staff_access"]["Returns"][number];

/** PostgREST: the function is not in the schema cache. */
const FUNCTION_NOT_FOUND = "PGRST202";

/**
 * The same answer from the four RPCs that predate get_my_staff_access, asked
 * together. Only used while a deploy runs ahead of its migration, so the
 * code can ship first without locking anyone out.
 */
async function readLegacyStaffAccess(
  supabase: SupabaseClient<Database>,
): Promise<StaffAccessRow | undefined | "unavailable"> {
  const [staff, password, profile, permissions] = await Promise.all([
    supabase.rpc("is_active_staff"),
    supabase.rpc("is_password_change_required"),
    supabase.rpc("get_my_staff_profile"),
    supabase.rpc("get_my_staff_permissions"),
  ]);
  if (staff.error || password.error || profile.error || permissions.error) {
    return "unavailable";
  }
  const row = profile.data?.[0];
  if (!staff.data || !row) return undefined;
  return {
    user_id: row.user_id,
    role: row.role,
    must_change_password: Boolean(password.data),
    permissions: permissions.data ?? [],
  };
}

export type ResolvedStaffAccess = {
  state: StaffAccessState;
  userId?: string;
  access?: StaffAccessRow;
};

/**
 * The single access decision shared by proxy.ts and every server render.
 *
 * Identity comes from `getClaims()`, which verifies the session JWT's signature
 * against the project's published signing keys (fetched once, then cached) --
 * no Auth server round trip per request. The trade-off is accepted: a session
 * signed out elsewhere stays usable until its access token expires (at most
 * `jwt_expiry`, one hour). Staff removal is not delayed -- deactivation is
 * read from the database below on every request. A project still on the
 * legacy shared JWT secret falls back to `getUser()` inside supabase-js.
 *
 * Staff status, the first-login password flag, role and section permissions
 * then come from one RPC instead of four.
 */
export async function resolveStaffAccess(
  supabase: SupabaseClient<Database>,
): Promise<ResolvedStaffAccess> {
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { state: "anonymous" };
  const userId = claims.sub;

  const { data: rows, error: accessError } = await supabase.rpc(
    "get_my_staff_access",
  );
  let access: StaffAccessRow | undefined;
  if (accessError?.code === FUNCTION_NOT_FOUND) {
    const legacy = await readLegacyStaffAccess(supabase);
    if (legacy === "unavailable") return { state: "unavailable", userId };
    access = legacy;
  } else if (accessError) {
    return { state: "unavailable", userId };
  } else {
    access = rows?.[0];
  }

  if (!access) return { state: "unapproved", userId };
  if (access.must_change_password) {
    return { state: "needs_password_change", userId, access };
  }

  // The same `aal` claim getAuthenticatorAssuranceLevel() reads, taken from
  // the token that was just verified.
  return {
    state: claims.aal === "aal2" ? "ready" : "needs_mfa",
    userId,
    access,
  };
}
