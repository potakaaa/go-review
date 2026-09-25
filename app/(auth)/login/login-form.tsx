"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { login, type LoginState } from "@/app/login/actions";
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
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({
  next,
  initialError,
  initialMessage,
}: {
  next?: string;
  initialError?: string;
  initialMessage?: string;
}) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, {
    error: initialError,
  });

  return (
    <form action={formAction} className="space-y-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}
      {initialMessage ? <Alert tone="ok">{initialMessage}</Alert> : null}

      <div>
        <label htmlFor="email" className="eyebrow mb-2 block">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="you@example.com"
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="password" className="eyebrow mb-2 block">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={FIELD}
        />
      </div>

      <SubmitButton />

      <p className="text-center text-sm text-muted">
        <Link
          href="/forgot-password"
          className="underline decoration-line-strong underline-offset-4 hover:text-ink"
        >
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}
