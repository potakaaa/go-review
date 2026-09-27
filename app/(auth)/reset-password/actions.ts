"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { z } from "zod";

import { readResetSession } from "@/app/(auth)/reset-password/reset-session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordSchema } from "@/lib/validation";

export type UpdatePasswordState = {
  errors?: { password?: string; confirmation?: string; code?: string };
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

const EXPIRED = "This reset session expired. Request a new link.";
const NOT_VERIFIED = "Password was not fully verified. Please try again.";

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
    // Secure password change only asks to reauthenticate once the session
    // is a day old, which a fresh recovery session never is.
    case "reauthentication_needed":
    case "reauthentication_not_valid":
      return { message: EXPIRED };
    case "over_request_rate_limit":
      return {
        message: "Too many attempts. Wait a few minutes, then try again.",
      };
    // Only if an authenticator was enrolled after this page loaded.
    case "insufficient_aal":
      return {
        message:
          "This account now has an authenticator. Reload the page and enter its code with your new password.",
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
  const supabase = await createClient();
  const session = await readResetSession(supabase);
  if (!session) return { message: EXPIRED };

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

  if (session.stepUpFactorId) {
    const code = String(formData.get("code") ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      return {
        errors: { code: "Enter the six-digit code from your authenticator app." },
      };
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: session.stepUpFactorId,
      code,
    });
    if (error) {
      console.error("[auth] password_reset_mfa_failed", {
        code: error.code,
        status: error.status,
      });
      return {
        errors: {
          code: "That code could not be verified. Wait for a new code and try again.",
        },
      };
    }
    // The page reads the code requirement from the session, which no longer
    // has one: if the password is refused next, the retry is not asked for a
    // second code.
    refresh();
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
    return { message: NOT_VERIFIED };
  }

  if (mustChangePassword) {
    try {
      const { error: staffStateError } = await createAdminClient().rpc(
        "complete_password_change",
        { p_user_id: session.user.id },
      );
      if (staffStateError) {
        console.error("[auth] staff_password_state_failed", {
          code: staffStateError.code,
        });
        return { message: NOT_VERIFIED };
      }
    } catch {
      console.error("[auth] staff_password_state_failed", {
        code: "service_role_unavailable",
      });
      return { message: NOT_VERIFIED };
    }
  }

  // Every other session is signed out; this one has just proven the inbox
  // (or the old password) and, where enrolled, the authenticator. Sending it
  // back through sign-in would ask for a second code within the same minute.
  // An account with no authenticator yet is taken to /mfa by the proxy.
  await supabase.auth.signOut({ scope: "others" });
  redirect("/dashboard");
}
