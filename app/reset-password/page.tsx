import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password?error=invalid_link");

  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden="true"
        className="page-grid pointer-events-none absolute inset-0 opacity-60"
      />
      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-8">
          <div
            aria-hidden="true"
            className="mb-6 flex size-11 items-center justify-center rounded-md border border-line-strong bg-surface font-mono text-xs font-medium tracking-tight text-ink"
          >
            NEW
          </div>
          <p className="eyebrow">Goreview / account recovery</p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            Choose a new password
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            Your recovery link has been verified. Set a strong password, then
            sign in and finish authenticator setup.
          </p>
        </div>

        <Card className="bg-surface/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6">
          <ResetPasswordForm />
        </Card>
      </div>
    </main>
  );
}
