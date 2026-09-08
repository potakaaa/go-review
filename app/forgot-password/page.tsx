import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/app/forgot-password/forgot-password-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;

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
            KEY
          </div>
          <p className="eyebrow">Goreview / account recovery</p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            Reset your password
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            Enter the email used for this workspace. We will send a private,
            single-use recovery link.
          </p>
        </div>

        <Card className="bg-surface/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6">
          <ForgotPasswordForm
            initialError={
              error === "invalid_link"
                ? "That reset link is invalid or expired. Request a new one."
                : undefined
            }
          />
        </Card>
      </div>
    </main>
  );
}
