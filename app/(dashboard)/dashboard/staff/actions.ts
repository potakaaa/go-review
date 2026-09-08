"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireSuperadmin } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordSchema } from "@/lib/validation";
import type { Json, StaffRole, StaffSection } from "@/lib/database.types";

export type StaffActionState = {
  message?: string;
  errors?: Record<string, string>;
};

const staffIdentitySchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  temporary_password: passwordSchema,
  role: z.enum(["admin", "superadmin"]),
});

const staffIdSchema = z.uuid("Invalid staff member.");
const sections: StaffSection[] = ["routes", "analytics", "convert", "stories", "staff"];

function selectedPermissions(formData: FormData): Json[] {
  return sections.flatMap((section) => {
    const canView = formData.get(`permission_${section}_view`) === "on";
    const canManage = formData.get(`permission_${section}_manage`) === "on";
    if (!canView && !canManage) return [];
    return [
      {
        section,
        can_view: canView || canManage,
        can_manage: canManage,
      },
    ];
  });
}

function selectedRouteAccess(formData: FormData): Json[] {
  const values = formData.getAll("route_access");
  return values.flatMap((value) => {
    if (typeof value !== "string" || !value) return [];
    const [routeId, accessLevel] = value.split(":");
    if (!z.uuid().safeParse(routeId).success) return [];
    if (accessLevel !== "view" && accessLevel !== "manage") return [];
    return [{ route_id: routeId, access_level: accessLevel }];
  });
}

export async function createStaff(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const parsed = staffIdentitySchema.safeParse({
    email: formData.get("email"),
    temporary_password: formData.get("temporary_password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Check the account details." };
  }

  const { supabase } = await requireSuperadmin();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.temporary_password,
    email_confirm: true,
  });
  if (error || !data.user) {
    console.error("[staff] auth_create_failed", { code: error?.code });
    return { message: "The account could not be created. Check whether the email is already in use." };
  }

  const { error: registerError } = await supabase.rpc("admin_register_staff", {
    p_user_id: data.user.id,
    p_role: parsed.data.role as StaffRole,
    p_permissions: selectedPermissions(formData),
    p_route_access: selectedRouteAccess(formData),
  });
  if (registerError) {
    await admin.auth.admin.deleteUser(data.user.id);
    console.error("[staff] profile_create_failed", { code: registerError.code });
    return { message: "The account could not be authorized. No account was kept." };
  }

  revalidatePath("/dashboard/staff");
  redirect(`/dashboard/staff/${data.user.id}?created=1`);
}

export async function updateStaff(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const userId = staffIdSchema.safeParse(formData.get("user_id"));
  if (!userId.success) return { message: "Invalid staff member." };

  const role = z.enum(["admin", "superadmin"]).safeParse(formData.get("role"));
  if (!role.success) return { message: "Invalid staff role." };

  const { supabase } = await requireSuperadmin();
  const { error } = await supabase.rpc("admin_update_staff", {
    p_user_id: userId.data,
    p_role: role.data,
    p_active: formData.get("active") === "on",
    p_permissions: selectedPermissions(formData),
    p_route_access: selectedRouteAccess(formData),
  });
  if (error) {
    console.error("[staff] update_failed", { code: error.code });
    return { message: "The staff member could not be updated." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/staff");
  revalidatePath(`/dashboard/staff/${userId.data}`);
  redirect(`/dashboard/staff/${userId.data}?saved=1`);
}

export async function resetStaffPassword(
  _previousState: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const userId = staffIdSchema.safeParse(formData.get("user_id"));
  const temporaryPassword = passwordSchema.safeParse(formData.get("temporary_password"));
  if (!userId.success) return { message: "Invalid staff member." };
  if (!temporaryPassword.success) {
    return { message: temporaryPassword.error.issues[0]?.message ?? "Check the temporary password." };
  }

  const { supabase } = await requireSuperadmin();
  const admin = createAdminClient();
  const { error: authError } = await admin.auth.admin.updateUserById(userId.data, {
    password: temporaryPassword.data,
  });
  if (authError) {
    console.error("[staff] password_reset_failed", { code: authError.code });
    return { message: "The temporary password could not be set." };
  }

  const { error: stateError } = await supabase.rpc(
    "admin_mark_password_change_required",
    { p_user_id: userId.data },
  );
  if (stateError) {
    console.error("[staff] password_state_failed", { code: stateError.code });
    return { message: "The password changed, but the first-login state could not be saved." };
  }

  revalidatePath(`/dashboard/staff/${userId.data}`);
  redirect(`/dashboard/staff/${userId.data}?password_reset=1`);
}
