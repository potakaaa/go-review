"use server";

import { redirect } from "next/navigation";
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
    // Intentionally generic: distinguishing "no such user" from "wrong
    // password" would confirm which email addresses have accounts.
    return { error: "Incorrect email or password." };
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

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login");
}
