import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next, error, message } = await searchParams;
  const initialError =
    error === "not_authorized"
      ? "This account is not authorized for this workspace."
      : error === "access_unavailable"
        ? "Secure access could not be verified. Please try again."
        : undefined;

  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-12">
      <div aria-hidden="true" className="page-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-8">
          <div
            aria-hidden="true"
            className="mb-6 flex size-11 items-center justify-center rounded-md border border-line-strong bg-surface font-mono text-xs font-medium tracking-tight text-ink"
          >
            GR
          </div>
          <p className="eyebrow">Goreview / private workspace</p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            Goreview Admin
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            Sign in to manage your review cards.
          </p>
        </div>

        <Card className="bg-surface/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6">
          <LoginForm
            next={typeof next === "string" ? next : undefined}
            initialError={initialError}
            initialMessage={
              message === "password_updated"
                ? "Password updated. Sign in with your new password."
                : undefined
            }
          />
        </Card>
      </div>
    </main>
  );
}
