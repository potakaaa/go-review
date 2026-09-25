"use client";

import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui";

/** Sign-out waits on the server; say so the moment it is tapped. */
export function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium text-subtle tap-target hover:bg-elevated hover:text-ink disabled:opacity-70"
    >
      {pending ? <Spinner className="size-3.5" /> : null}
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
