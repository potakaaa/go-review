"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { z } from "zod";

import { checkStaffAccess } from "@/lib/auth";
import { safeNextPath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address."),
  password: z.string().min(1, "Enter your password."),
});

/**
 * There is deliberately no public sign-up action. Accounts are created by a
 * superadmin or directly in the Supabase dashboard.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createClient();
  const captchaToken = formData.get("cf-turnstile-response");
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options:
      typeof captchaToken === "string" && captchaToken
        ? { captchaToken }
        : undefined,
  });

  if (error) {
    console.error("[auth] sign_in_failed", {
      code: error.code,
      status: error.status,
    });
    return { error: signInMessage(error) };
  }

  const access = await checkStaffAccess(supabase);
  if (access.state === "unapproved") {
    await supabase.auth.signOut({ scope: "global" });
    return { error: "This account is not authorized for this workspace." };
  }
  if (access.state === "anonymous" || access.state === "unavailable") {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Sign-in could not be verified. Please try again." };
  }

  const destination = safeNextPath(formData.get("next"));

  if (access.state === "needs_password_change") {
    redirect("/reset-password?required=1");
  }

  if (access.state === "needs_mfa") {
    redirect(`/mfa?next=${encodeURIComponent(destination)}`);
  }

  redirect(destination);
}

/**
 * Only a genuine credential mismatch gets the generic message: saying "no such
 * user" would confirm which addresses own accounts here.
 *
 * Every other failure is about configuration or account state. The page says
 * only that the password is not the thing to go change -- the code that names
 * the actual setting goes to the server log, not to a public form. Flattening
 * all of these into "Incorrect email or password." is what sent someone
 * retyping a password that was right all along.
 */
function signInMessage(error: AuthError): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "This address still needs to be confirmed. Check your inbox for the confirmation email.";
    case "user_banned":
      return "This account is locked. Ask a superadmin to restore it.";
    case "captcha_failed":
      return "The sign-in security check could not be completed. This is a project setting, not your password.";
    case "over_request_rate_limit":
      return "Too many sign-in attempts. Wait a few minutes, then try again.";
    case "signup_disabled":
    case "email_provider_disabled":
    case "provider_disabled":
      return "Email sign-in is turned off for this workspace. This is a project setting, not your password.";
  }

  // An unrecognised code is still worth distinguishing from a wrong password:
  // the password is not the thing to go change.
  if (error.status === 429) {
    return "Too many sign-in attempts. Wait a few minutes, then try again.";
  }
  return "Sign-in is unavailable right now, and this is not a problem with your password. Try again shortly.";
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}
