"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
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

/**
 * "Request a new link" was the answer to every failure here, including the
 * ones a new link cannot fix. Someone whose password was refused for being
 * breached, or for matching the one they already have, would request link
 * after link and be refused each time for a reason the page never named.
 *
 * A rejected password belongs under the password field; only a genuinely
 * spent session should send someone back for another email.
 */
function updateFailure(error: AuthError): UpdatePasswordState {
  switch (error.code) {
    case "same_password":
      return {
        errors: {
          password: "This is already your password. Choose a different one.",
        },
      };
    case "weak_password":
      return {
        errors: {
          password:
            "This password has appeared in a known data breach, so it cannot be used. Choose a different one.",
        },
      };
    case "session_expired":
    case "session_not_found":
      return { message: "This reset session expired. Request a new link." };
    case "over_request_rate_limit":
      return {
        message: "Too many attempts. Wait a few minutes, then try again.",
      };
    case "reauthentication_needed":
    case "reauthentication_not_valid":
    case "insufficient_aal":
      return {
        message:
          "This workspace will not accept a password change from a recovery link alone. A superadmin can set the password from the Supabase dashboard instead.",
      };
  }
  return {
    message:
      "Password could not be updated, and a new link will not change that. Check the server log for the reason.",
  };
}

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
    console.error("[auth] password_update_failed", {
      code: error.code,
      status: error.status,
    });
    return updateFailure(error);
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
