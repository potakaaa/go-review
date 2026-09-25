import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { isAdminHost } from "@/lib/site";

import { createClient } from "@/lib/supabase/server";
import {
  resolveStaffAccess,
  type ResolvedStaffAccess,
} from "@/lib/staff-access";
import type { StaffRole, StaffSection } from "@/lib/database.types";

export type { StaffAccessState } from "@/lib/staff-access";

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
 * Verifies identity, checks the database-backed staff allowlist, then checks
 * the current Authenticator Assurance Level. No user metadata is trusted for
 * authorization. See resolveStaffAccess for how each step is answered.
 */
export async function checkStaffAccess(
  supabase: ServerSupabaseClient,
): Promise<ResolvedStaffAccess> {
  return resolveStaffAccess(supabase);
}

const STAFF_SECTIONS: StaffSection[] = [
  "routes",
  "analytics",
  "convert",
  "stories",
  "orders",
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

  const profile = access.access;
  if (!profile) redirect("/login?error=access_unavailable");

  const permissions = Object.fromEntries(
    STAFF_SECTIONS.map((section) => {
      const row = profile.permissions.find((permission) => permission.section === section);
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
