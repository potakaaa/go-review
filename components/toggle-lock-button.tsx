"use client";

import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { toggleRouteLocked } from "@/app/(dashboard)/dashboard/routes/actions";
import { useRouteState } from "@/components/route-state";
import { Spinner, buttonClass } from "@/components/ui";

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
      {pending ? <Spinner /> : null}
      {pending ? "Saving…" : locked ? "Unlock editing" : "Lock editing"}
    </button>
  );
}

/** Shows the lock badge change immediately; the toast confirms the save. */
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
  const state = useRouteState({ locked });

  async function action(formData: FormData) {
    const nextLocked = formData.get("next_locked") === "true";
    state.apply({ locked: nextLocked });
    const result = await toggleRouteLocked(formData);
    if (result.ok) {
      toast.success(nextLocked ? "Editing locked" : "Editing unlocked", {
        description: nextLocked
          ? `${businessName}'s destination can't be changed until it is unlocked.`
          : `${businessName}'s details can be edited again.`,
      });
    } else {
      toast.error("Lock not changed", { description: result.message });
    }
  }

  return (
    <form action={action} className={className}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next_locked" value={String(!state.locked)} />
      <Submit locked={state.locked} businessName={businessName} />
    </form>
  );
}
