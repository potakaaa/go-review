"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  updatePassword,
  type UpdatePasswordState,
} from "@/app/reset-password/actions";
import { Alert, buttonClass, FormError } from "@/components/ui";

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
      {pending ? "Updating…" : "Set new password"}
    </button>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<UpdatePasswordState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

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

      <SubmitButton />
    </form>
  );
}
