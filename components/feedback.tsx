"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * How the workspace reports outcomes. Every result a staff member caused --
 * saved, created, failed -- is a toast, so it always appears in the same place
 * whether the page changed or not. Field-level problems additionally stay
 * written under the field, where the fix happens.
 */

export type FlashTone = "success" | "error" | "info" | "warning";

/**
 * Flash ids already announced in this tab. Back/forward navigation restores a
 * page's rendered tree -- including a flash -- from the router cache, and
 * "Changes saved" must not reappear when you simply go back to the page.
 */
const announced = new Set<string>();

/**
 * Shows a toast for an outcome carried through a redirect (`?saved=1`), then
 * removes those query parameters so a refresh or a shared link does not
 * repeat it.
 *
 * Render it with `key={flashId}` and a fresh id per server render (the `Flash`
 * helper does this): the same page can be saved twice in a row, and the second
 * save must toast too.
 */
export function FlashToast({
  flashId,
  tone,
  title,
  description,
  params,
}: {
  flashId: string;
  tone: FlashTone;
  title: string;
  description?: string;
  params: readonly string[];
}) {
  useEffect(() => {
    if (!announced.has(flashId)) {
      announced.add(flashId);
      toast[tone](title, { id: flashId, description });
    }

    const url = new URL(window.location.href);
    let changed = false;
    for (const param of params) {
      if (url.searchParams.has(param)) {
        url.searchParams.delete(param);
        changed = true;
      }
    }
    // Native history calls stay in sync with the Next.js router and
    // useSearchParams, without a navigation or a server round trip.
    if (changed) window.history.replaceState(window.history.state, "", url);
  }, [flashId, tone, title, description, params]);

  return null;
}

type ActionFeedbackState = {
  message?: string;
  error?: string;
  errors?: Record<string, string | undefined>;
};

/**
 * Toasts each new Server Action result from `useActionState`.
 *
 * `useActionState` hands back a new state object per submission, so the same
 * error submitted twice toasts twice -- the second tap is acknowledged. The
 * initial `{}` state toasts nothing.
 */
export function useActionFeedback(
  state: ActionFeedbackState,
  { tone = "error" }: { tone?: FlashTone } = {},
) {
  useEffect(() => {
    const message = state.message ?? state.error;
    const fieldCount = Object.values(state.errors ?? {}).filter(Boolean).length;
    const fieldHint =
      fieldCount === 1
        ? "Check the highlighted field."
        : `Check the ${fieldCount} highlighted fields.`;

    if (message) {
      toast[tone](message, fieldCount ? { description: fieldHint } : undefined);
    } else if (fieldCount) {
      toast.error(
        fieldCount === 1
          ? "One field needs attention"
          : `${fieldCount} fields need attention`,
        { description: "The problem is written under each field." },
      );
    }
  }, [state, tone]);
}
