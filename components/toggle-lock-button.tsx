"use client";

import { useFormStatus } from "react-dom";

import { toggleRouteLocked } from "@/app/(dashboard)/dashboard/routes/actions";
import { buttonClass } from "@/components/ui";

function Submit({
  locked,
  businessName,
}: {
  locked: boolean;
  businessName: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`${locked ? "Unlock editing for" : "Lock editing for"} ${businessName}`}
      className={buttonClass("secondary", "w-full text-sm")}
    >
      {pending
        ? locked
          ? "Unlocking…"
          : "Locking…"
        : locked
          ? "Unlock editing"
          : "Lock editing"}
    </button>
  );
}

export function ToggleLockButton({
  id,
  locked,
  businessName,
  className = "",
}: {
  id: string;
  locked: boolean;
  businessName: string;
  className?: string;
}) {
  return (
    <form action={toggleRouteLocked} className={className}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next_locked" value={String(!locked)} />
      <Submit locked={locked} businessName={businessName} />
    </form>
  );
}
