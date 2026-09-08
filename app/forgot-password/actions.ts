"use server";

import { z } from "zod";

import { adminOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type PasswordRecoveryState = {
  error?: string;
  submitted?: boolean;
};

const recoverySchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export async function requestPasswordReset(
  _previousState: PasswordRecoveryState,
  formData: FormData,
): Promise<PasswordRecoveryState> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your email." };
  }

  const supabase = await createClient();
  const captchaToken = formData.get("cf-turnstile-response");
  const callbackUrl = new URL("/auth/callback", `${adminOrigin()}/`);
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: callbackUrl.toString(),
      captchaToken:
        typeof captchaToken === "string" && captchaToken
          ? captchaToken
          : undefined,
    },
  );

  if (error) {
    // Keep the response indistinguishable from success so this form cannot be
    // used to discover which email address owns the workspace.
    console.error("[auth] password_recovery_request_failed", {
      code: error.code,
    });
  }

  return { submitted: true };
}
