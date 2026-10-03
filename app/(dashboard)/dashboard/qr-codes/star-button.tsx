"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { toggleQrStar } from "./actions";

/** Stars float a code to the top of the library; the star flips on tap. */
export function StarButton({ id, starred, label }: { id: string; starred: boolean; label: string }) {
  const [optimistic, setOptimistic] = useOptimistic(starred);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !optimistic;
    const data = new FormData();
    data.set("id", id);
    data.set("starred", String(next));
    startTransition(async () => {
      setOptimistic(next);
      const result = await toggleQrStar(data);
      if (!result.ok) toast.error("Not changed", { description: result.message });
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimistic}
      aria-label={`${optimistic ? "Unstar" : "Star"} ${label}`}
      className={`flex size-10 shrink-0 items-center justify-center rounded-full tap-target transition-colors hover:bg-elevated ${optimistic ? "text-warn" : "text-subtle"}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill={optimistic ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
      </svg>
    </button>
  );
}
