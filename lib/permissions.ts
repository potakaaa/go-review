import "server-only";

import { notFound } from "next/navigation";

import {
  requireStaffMfa,
  type StaffContext,
  type StaffPermission,
} from "@/lib/auth";
import type { StaffRole, StaffSection } from "@/lib/database.types";

export type PermissionLevel = "view" | "manage";

export { STAFF_SECTIONS } from "@/lib/staff-types";

export type SerializedStaffAccess = {
  role: StaffRole;
  permissions: Record<StaffSection, StaffPermission>;
};

export function isSuperadmin(context: StaffContext | SerializedStaffAccess): boolean {
  return "profile" in context
    ? context.profile.role === "superadmin"
    : context.role === "superadmin";
}

export function hasPermission(
  context: StaffContext | SerializedStaffAccess,
  section: StaffSection,
  level: PermissionLevel,
): boolean {
  if (isSuperadmin(context)) return true;
  const permission = context.permissions[section];
  return level === "manage" ? permission.canManage : permission.canView;
}

/** Explicit first-line guard for Server Actions and route handlers. */
export async function requireAuth(): Promise<StaffContext> {
  return requireStaffMfa();
}

export async function requirePermission(
  section: StaffSection,
  level: PermissionLevel = "view",
): Promise<StaffContext> {
  const context = await requireAuth();
  if (!hasPermission(context, section, level)) notFound();
  return context;
}

export async function requireSuperadmin(): Promise<StaffContext> {
  const context = await requireAuth();
  if (!isSuperadmin(context)) notFound();
  return context;
}

/** Dashboard is useful to any approved admin with at least one visible area. */
export async function requireDashboardAccess(): Promise<StaffContext> {
  const context = await requireAuth();
  if (
    !isSuperadmin(context) &&
    !hasPermission(context, "routes", "view") &&
    !hasPermission(context, "analytics", "view")
  ) {
    notFound();
  }
  return context;
}

export async function requireRouteReportingAccess(): Promise<StaffContext> {
  const context = await requireAuth();
  if (
    !isSuperadmin(context) &&
    !hasPermission(context, "routes", "view") &&
    !hasPermission(context, "analytics", "view")
  ) {
    notFound();
  }
  return context;
}
