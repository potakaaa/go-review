"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestPasswordReset,
  type PasswordRecoveryState,
} from "@/app/forgot-password/actions";
import { Alert, buttonClass } from "@/components/ui";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass("primary", "w-full")}
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm({
  initialError,
}: {
  initialError?: string;
}) {
  const [state, formAction] = useActionState<
    PasswordRecoveryState,
    FormData
  >(requestPasswordReset, { error: initialError });

  if (state.submitted) {
    return (
      <div className="space-y-5">
        <Alert tone="ok" title="Check your email">
          If that address belongs to the workspace, a password-reset link is on
          its way. Open it in this browser and check spam if it does not arrive.
        </Alert>
        <Link href="/login" className={buttonClass("secondary", "w-full")}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <div>
        <label htmlFor="email" className="eyebrow mb-2 block">
          Account email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@example.com"
          className={FIELD}
        />
      </div>

      <SubmitButton />

      <p className="text-center text-sm text-muted">
        <Link
          href="/login"
          className="underline decoration-line-strong underline-offset-4 hover:text-ink"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
