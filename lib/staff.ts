import "server-only";

import { notFound } from "next/navigation";

import { requireSuperadmin } from "@/lib/permissions";
import type {
  StaffMember,
  StaffPermissionRow,
  StaffRouteAccessRow,
  StaffRouteOption,
} from "@/lib/staff-types";

export type {
  StaffMember,
  StaffPermissionRow,
  StaffRouteAccessRow,
  StaffRouteOption,
} from "@/lib/staff-types";

export async function getStaffOverview() {
  const { supabase } = await requireSuperadmin();
  const [{ data: staff, error: staffError }, { data: routes, error: routesError }] =
    await Promise.all([
      supabase.rpc("admin_list_staff"),
      supabase
        .from("redirect_routes")
        .select("id, business_name, slug, publication_status")
        .order("business_name", { ascending: true }),
    ]);

  if (staffError || routesError) {
    console.error("[staff] overview_failed", {
      staff: staffError?.code,
      routes: routesError?.code,
    });
    throw new Error("Could not load staff management.");
  }

  return {
    staff: (staff ?? []) as StaffMember[],
    routes: (routes ?? []) as StaffRouteOption[],
  };
}

export async function getStaffEditor(userId: string) {
  const { supabase } = await requireSuperadmin();
  const [{ data: staff, error: staffError }, { data: permissions, error: permissionsError }, { data: routeAccess, error: routeAccessError }, { data: routes, error: routesError }] =
    await Promise.all([
      supabase.rpc("admin_list_staff"),
      supabase.rpc("admin_list_staff_permissions", { p_user_id: userId }),
      supabase.rpc("admin_list_route_access", { p_user_id: userId }),
      supabase
        .from("redirect_routes")
        .select("id, business_name, slug, publication_status")
        .order("business_name", { ascending: true }),
    ]);

  if (staffError || permissionsError || routeAccessError || routesError) {
    console.error("[staff] editor_failed", {
      staff: staffError?.code,
      permissions: permissionsError?.code,
      routeAccess: routeAccessError?.code,
      routes: routesError?.code,
    });
    throw new Error("Could not load staff member.");
  }

  const member = (staff ?? []).find((item) => item.user_id === userId) as
    | StaffMember
    | undefined;
  if (!member) notFound();

  return {
    member,
    permissions: (permissions ?? []) as StaffPermissionRow[],
    routeAccess: (routeAccess ?? []) as StaffRouteAccessRow[],
    routes: (routes ?? []) as StaffRouteOption[],
  };
}
