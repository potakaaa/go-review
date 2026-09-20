import "server-only";

import { notFound } from "next/navigation";

import { requireSuperadmin } from "@/lib/permissions";
import type {
  StaffAccessPreset,
  StaffMember,
  StaffPermissionRow,
  StaffRouteAccessRow,
  StaffRouteOption,
} from "@/lib/staff-types";

export type {
  StaffAccessPreset,
  StaffMember,
  StaffPermissionRow,
  StaffRouteAccessRow,
  StaffRouteOption,
} from "@/lib/staff-types";

/**
 * `destination_url` and `created_at` are not shown for their own sake: the
 * picker prints one of them only when two routes share a business name.
 */
const ROUTE_OPTION_COLUMNS =
  "id, business_name, slug, publication_status, destination_url, created_at";

export async function getStaffOverview() {
  const { supabase } = await requireSuperadmin();
  const { data: staff, error: staffError } = await supabase.rpc("admin_list_staff");

  if (staffError) {
    console.error("[staff] overview_failed", { staff: staffError.code });
    throw new Error("Could not load staff management.");
  }

  return { staff: (staff ?? []) as StaffMember[] };
}

export async function getStaffEditor(userId: string) {
  const { supabase } = await requireSuperadmin();
  const [
    { data: staff, error: staffError },
    { data: permissions, error: permissionsError },
    { data: routeAccess, error: routeAccessError },
    { data: routes, error: routesError },
    { data: allAccess, error: allAccessError },
  ] = await Promise.all([
    supabase.rpc("admin_list_staff"),
    supabase.rpc("admin_list_staff_permissions", { p_user_id: userId }),
    supabase.rpc("admin_list_route_access", { p_user_id: userId }),
    supabase
      .from("redirect_routes")
      .select(ROUTE_OPTION_COLUMNS)
      .order("business_name", { ascending: true }),
    supabase.rpc("admin_list_all_route_access"),
  ]);

  if (
    staffError ||
    permissionsError ||
    routeAccessError ||
    routesError ||
    allAccessError
  ) {
    console.error("[staff] editor_failed", {
      staff: staffError?.code,
      permissions: permissionsError?.code,
      routeAccess: routeAccessError?.code,
      routes: routesError?.code,
      allAccess: allAccessError?.code,
    });
    throw new Error("Could not load staff member.");
  }

  const roster = (staff ?? []) as StaffMember[];
  const member = roster.find((item) => item.user_id === userId);
  if (!member) notFound();

  return {
    member,
    permissions: (permissions ?? []) as StaffPermissionRow[],
    routeAccess: (routeAccess ?? []) as StaffRouteAccessRow[],
    routes: (routes ?? []) as StaffRouteOption[],
    presets: buildAccessPresets(roster, allAccess ?? [], userId),
  };
}

/**
 * Starting points for "copy access from". A superadmin is left out: the role
 * already reaches every route without storing a single grant, so copying one
 * would hand over an empty selection.
 */
function buildAccessPresets(
  roster: readonly StaffMember[],
  allAccess: ReadonlyArray<{
    user_id: string;
    route_id: string;
    access_level: StaffRouteAccessRow["access_level"];
  }>,
  excludeUserId: string,
): StaffAccessPreset[] {
  const byUser = new Map<string, StaffRouteAccessRow[]>();
  for (const row of allAccess) {
    const rows = byUser.get(row.user_id);
    const entry = { route_id: row.route_id, access_level: row.access_level };
    if (rows) rows.push(entry);
    else byUser.set(row.user_id, [entry]);
  }

  return roster
    .filter(
      (item) => item.user_id !== excludeUserId && item.role !== "superadmin",
    )
    .map((item) => ({
      user_id: item.user_id,
      email: item.email,
      role: item.role,
      all_routes_access: item.all_routes_access,
      access: byUser.get(item.user_id) ?? [],
    }))
    .filter(
      (preset) => preset.all_routes_access !== null || preset.access.length > 0,
    );
}
