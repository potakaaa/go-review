import "server-only";

import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isAdminHost, isLocalDevelopmentHost } from "@/lib/site";

import { createClient } from "@/lib/supabase/server";

export type StaffAccessState =
  | "anonymous"
  | "unapproved"
  | "needs_mfa"
  | "ready"
  | "unavailable";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Revalidates identity, checks the database-backed staff allowlist, then checks
 * the current Authenticator Assurance Level. No user metadata is trusted for
 * authorization.
 */
export async function checkStaffAccess(
  supabase: ServerSupabaseClient,
): Promise<{
  state: StaffAccessState;
  userId?: string;
}> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return { state: "anonymous" };

  const { data: isStaff, error: staffError } = await supabase.rpc(
    "is_active_staff",
  );
  if (staffError) return { state: "unavailable", userId: user.id };
  if (!isStaff) return { state: "unapproved", userId: user.id };

  if (isLocalDevelopmentHost((await headers()).get("host"))) {
    return { state: "ready", userId: user.id };
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) return { state: "unavailable", userId: user.id };

  return {
    state: assurance.currentLevel === "aal2" ? "ready" : "needs_mfa",
    userId: user.id,
  };
}

export async function requireStaffMfa(): Promise<{
  supabase: ServerSupabaseClient;
  userId: string;
}> {
  if (!isAdminHost((await headers()).get("host"))) notFound();
  const supabase = await createClient();
  const access = await checkStaffAccess(supabase);

  if (access.state === "needs_mfa") redirect("/mfa");
  if (access.state !== "ready" || !access.userId) redirect("/login");

  return { supabase, userId: access.userId };
}
