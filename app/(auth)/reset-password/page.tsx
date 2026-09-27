import type { Metadata, Viewport } from "next";

import { Card } from "@/components/ui";
import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form";
import { readResetSession } from "@/app/(auth)/reset-password/reset-session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string | string[] }>;
}) {
  const params = await searchParams;
  const required = params.required === "1" || params.required?.[0] === "1";
  const supabase = await createClient();
  const session = await readResetSession(supabase);

  if (!session) redirect("/forgot-password?error=invalid_link");
  const needsCode = Boolean(session.stepUpFactorId);

  return (
    <main
      data-theme="admin"
      className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-canvas px-5 py-12 text-ink"
    >
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
          <p className="eyebrow">
            Goreview / {required ? "first sign-in" : "account recovery"}
          </p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            Choose a new password
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            {required
              ? "Your temporary password must be replaced before you can open the workspace."
              : needsCode
                ? "Your recovery link has been verified. Enter a code from your authenticator app along with your new password."
                : "Your recovery link has been verified. Set a strong password, then finish authenticator setup."}
          </p>
        </div>

        <Card className="bg-surface/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6">
          <ResetPasswordForm
            email={session.user.email ?? ""}
            needsCode={needsCode}
          />
        </Card>
      </div>
    </main>
  );
}
