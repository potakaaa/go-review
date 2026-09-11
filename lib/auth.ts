import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isAdminHost } from "@/lib/site";

import { createClient } from "@/lib/supabase/server";
import type { StaffRole, StaffSection } from "@/lib/database.types";

export type StaffAccessState =
  | "anonymous"
  | "unapproved"
  | "needs_password_change"
  | "needs_mfa"
  | "ready"
  | "unavailable";

export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type StaffProfile = {
  userId: string;
  role: StaffRole;
  mustChangePassword: boolean;
};

export type StaffPermission = {
  canView: boolean;
  canManage: boolean;
};

export type StaffContext = {
  supabase: ServerSupabaseClient;
  userId: string;
  profile: StaffProfile;
  permissions: Record<StaffSection, StaffPermission>;
};

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

  // These checks are independent after identity is known. Keep the same
  // fail-closed decisions while removing one serialized round trip.
  const [
    { data: isStaff, error: staffError },
    { data: mustChangePassword, error: passwordStateError },
  ] = await Promise.all([
    supabase.rpc("is_active_staff"),
    supabase.rpc("is_password_change_required"),
  ]);
  if (staffError) return { state: "unavailable", userId: user.id };
  if (!isStaff) return { state: "unapproved", userId: user.id };

  if (passwordStateError) return { state: "unavailable", userId: user.id };
  if (mustChangePassword) {
    return { state: "needs_password_change", userId: user.id };
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) return { state: "unavailable", userId: user.id };

  return {
    state: assurance.currentLevel === "aal2" ? "ready" : "needs_mfa",
    userId: user.id,
  };
}

const STAFF_SECTIONS: StaffSection[] = [
  "routes",
  "analytics",
  "convert",
  "stories",
  "staff",
];

/**
 * React's request cache makes the layout, page and data helpers share this
 * context during one server render. It is request-scoped, so auth state and
 * permissions never become a cross-user cache.
 */
export const requireStaffMfa = cache(async (): Promise<StaffContext> => {
  if (!isAdminHost((await headers()).get("host"))) notFound();
  const supabase = await createClient();
  const access = await checkStaffAccess(supabase);

  if (access.state === "needs_password_change") {
    redirect("/reset-password?required=1");
  }
  if (access.state === "needs_mfa") redirect("/mfa");
  if (access.state !== "ready" || !access.userId) redirect("/login");

  const [{ data: profileRows, error: profileError }, { data: permissionRows, error: permissionError }] =
    await Promise.all([
      supabase.rpc("get_my_staff_profile"),
      supabase.rpc("get_my_staff_permissions"),
    ]);

  const profile = profileRows?.[0];
  if (profileError || permissionError || !profile) {
    redirect("/login?error=access_unavailable");
  }

  const permissions = Object.fromEntries(
    STAFF_SECTIONS.map((section) => {
      const row = permissionRows?.find((permission) => permission.section === section);
      return [
        section,
        {
          canView: row?.can_view ?? false,
          canManage: row?.can_manage ?? false,
        },
      ];
    }),
  ) as Record<StaffSection, StaffPermission>;

  return {
    supabase,
    userId: access.userId,
    profile: {
      userId: profile.user_id,
      role: profile.role,
      mustChangePassword: profile.must_change_password,
    },
    permissions,
  };
});
