"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordSchema } from "@/lib/validation";

export type UpdatePasswordState = {
  errors?: { password?: string; confirmation?: string };
  message?: string;
};

const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    path: ["confirmation"],
    message: "Passwords do not match.",
  });

export async function updatePassword(
  _previousState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });

  if (!parsed.success) {
    const errors: UpdatePasswordState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        (field === "password" || field === "confirmation") &&
        !errors[field]
      ) {
        errors[field] = issue.message;
      }
    }
    return { errors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { message: "This reset session expired. Request a new link." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    console.error("[auth] password_update_failed", { code: error.code });
    return { message: "Password could not be updated. Request a new link." };
  }

  const { data: mustChangePassword, error: passwordStateError } =
    await supabase.rpc("is_password_change_required");
  if (passwordStateError) {
    console.error("[auth] staff_password_state_check_failed", {
      code: passwordStateError.code,
    });
    return { message: "Password was not fully verified. Please try again." };
  }

  if (mustChangePassword) {
    try {
      const { error: staffStateError } = await createAdminClient().rpc(
        "complete_password_change",
        { p_user_id: user.id },
      );
      if (staffStateError) {
        console.error("[auth] staff_password_state_failed", {
          code: staffStateError.code,
        });
        return { message: "Password was not fully verified. Please try again." };
      }
    } catch {
      console.error("[auth] staff_password_state_failed", {
        code: "service_role_unavailable",
      });
      return { message: "Password was not fully verified. Please try again." };
    }
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?message=password_updated");
}
