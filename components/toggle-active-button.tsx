"use client";

import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { toggleRouteActive } from "@/app/(dashboard)/dashboard/routes/actions";
import { useRouteState } from "@/components/route-state";
import { Spinner, buttonClass } from "@/components/ui";

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
      {pending ? <Spinner /> : null}
      {pending ? "Saving…" : active ? "Deactivate" : "Activate"}
    </button>
  );
}

/**
 * Flips the route's status badge the instant it is tapped (see RouteState),
 * then confirms or rolls back with a toast once the server has answered.
 */
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
  const state = useRouteState({ active });

  async function action(formData: FormData) {
    const nextActive = formData.get("next_active") === "true";
    state.apply({ active: nextActive });
    const result = await toggleRouteActive(formData);
    if (result.ok) {
      toast.success(nextActive ? "Route activated" : "Route deactivated", {
        description: nextActive
          ? `${businessName}'s card sends customers to the review page again.`
          : `${businessName}'s card now shows the deactivated page.`,
      });
    } else {
      toast.error("Status not changed", { description: result.message });
    }
  }

  return (
    <form action={action} className={className}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next_active" value={String(!state.active)} />
      <Submit active={state.active} businessName={businessName} />
    </form>
  );
}
