"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  updatePassword,
  type UpdatePasswordState,
} from "@/app/(auth)/reset-password/actions";
import { useActionFeedback } from "@/components/feedback";
import { buttonClass, FormError, Spinner } from "@/components/ui";

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
      {pending ? <Spinner /> : null}
      {pending ? "Updating…" : "Set new password"}
    </button>
  );
}

export function ResetPasswordForm({
  email,
  needsCode,
}: {
  email: string;
  needsCode: boolean;
}) {
  const [state, formAction] = useActionState<UpdatePasswordState, FormData>(
    updatePassword,
    {},
  );
  useActionFeedback(state);

  return (
    <form action={formAction} className="space-y-5">
      {/* Names the account, so a password manager replaces the saved password
          for it instead of keeping the old one or saving a nameless entry. */}
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={email}
        readOnly
        hidden
      />

      <div>
        <label htmlFor="password" className="eyebrow mb-2 block">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={14}
          autoComplete="new-password"
          aria-describedby="password-help"
          className={FIELD}
        />
        <p id="password-help" className="mt-2 text-xs leading-5 text-subtle">
          At least 14 characters with uppercase, lowercase, a number, and a
          symbol.
        </p>
        <FormError>{state.errors?.password}</FormError>
      </div>

      <div>
        <label htmlFor="confirmation" className="eyebrow mb-2 block">
          Confirm new password
        </label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          required
          minLength={14}
          autoComplete="new-password"
          className={FIELD}
        />
        <FormError>{state.errors?.confirmation}</FormError>
      </div>

      {/* Last, so the code is typed just before it is sent: each code only
          lives for thirty seconds. */}
      {needsCode ? (
        <div>
          <label htmlFor="code" className="eyebrow mb-2 block">
            Authenticator code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            aria-describedby="code-help"
            className={`${FIELD} text-center font-mono tracking-[0.28em]`}
          />
          <p id="code-help" className="mt-2 text-xs leading-5 text-subtle">
            From the authenticator app you enrolled for Goreview Admin.
          </p>
          <FormError>{state.errors?.code}</FormError>
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}
