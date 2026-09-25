"use client";

import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import { publishRoute } from "@/app/(dashboard)/dashboard/routes/actions";
import { useRouteState } from "@/components/route-state";
import { Spinner, buttonClass } from "@/components/ui";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass("primary", "mt-4 w-full sm:w-auto")}
    >
      {pending ? <Spinner /> : null}
      {pending ? "Publishing…" : "Publish route"}
    </button>
  );
}

/**
 * The superadmin approval panel for a draft. Publishing hides the panel and
 * clears the draft badge at once; a failure brings both back with a toast.
 */
export function PublishRouteForm({
  id,
  businessName,
}: {
  id: string;
  businessName: string;
}) {
  const state = useRouteState({ published: false });
  if (state.published) return null;

  async function action(formData: FormData) {
    state.apply({ published: true, active: true });
    const result = await publishRoute(formData);
    if (result.ok) {
      toast.success("Route published", {
        description: `${businessName}'s card is live.`,
      });
    } else {
      toast.error("Not published", { description: result.message });
    }
  }

  return (
    <form
      action={action}
      className="rounded-xl border border-warn/30 bg-warn-soft p-5"
    >
      <input type="hidden" name="id" value={id} />
      <p className="eyebrow text-warn">Superadmin approval</p>
      <p className="mt-2 text-sm leading-6 text-muted">
        This draft is not public yet. Publish it after checking the
        destination and business details.
      </p>
      <Submit />
    </form>
  );
}
