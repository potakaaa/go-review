"use client";

import { useFormStatus } from "react-dom";

import { toggleRouteActive } from "@/app/(dashboard)/dashboard/routes/actions";
import { buttonClass } from "@/components/ui";

function Submit({ active, businessName }: { active: boolean; businessName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      // The visible label is short enough to fit a phone button; the accessible
      // name spells out which card it affects, since a list shows many.
      aria-label={`${active ? "Deactivate" : "Activate"} the card for ${businessName}`}
      className={buttonClass(active ? "danger" : "secondary", "w-full text-sm")}
    >
      {pending ? "Saving…" : active ? "Deactivate" : "Activate"}
    </button>
  );
}

export function ToggleActiveButton({
  id,
  active,
  businessName,
  className = "",
}: {
  id: string;
  active: boolean;
  businessName: string;
  className?: string;
}) {
  return (
    <form action={toggleRouteActive} className={className}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next_active" value={String(!active)} />
      <Submit active={active} businessName={businessName} />
    </form>
  );
}
