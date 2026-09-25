import type { Metadata, Viewport } from "next";

import { Flash } from "@/components/flash";
import { Card } from "@/components/ui";

import { ForgotPasswordForm } from "@/app/(auth)/forgot-password/forgot-password-form";

/**
 * Why the link failed, in the reader's terms.
 *
 * Every one of these used to read "invalid or expired", which told someone
 * holding a link they had just received nothing about what to do next.
 */
const LINK_ERRORS: Record<string, string> = {
  expired_link:
    "That reset link has expired. Request a new one and open it within the hour.",
  used_link:
    "That reset link has already been used, or a newer one has replaced it. Only the most recent email works -- request a new link and open that one.",
  wrong_browser:
    "That reset link was opened in a different browser from the one that requested it. Request a new link and open it in this browser.",
  invalid_link: "That reset link is invalid or expired. Request a new one.",
};

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0a0a0a" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const linkError = typeof error === "string" ? LINK_ERRORS[error] : undefined;

  return (
    <main
      data-theme="admin"
      className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-canvas px-5 py-12 text-ink"
    >
      {linkError ? (
        <Flash
          tone="error"
          title="That reset link did not work"
          description={linkError}
          params={["error"]}
        />
      ) : null}
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
          <ForgotPasswordForm />
        </Card>
      </div>
    </main>
  );
}
