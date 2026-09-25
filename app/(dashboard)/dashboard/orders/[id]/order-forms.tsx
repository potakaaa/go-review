"use client";

import { useOptimistic, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import {
  retryOrderNotification,
  updateOrder,
} from "@/app/(dashboard)/dashboard/orders/actions";
import { Spinner, buttonClass } from "@/components/ui";
import type { OrderStatus } from "@/lib/database.types";

const STATUSES: OrderStatus[] = ["new", "contacted", "confirmed", "completed", "cancelled"];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass("primary", "mt-5 w-full")}>
      {pending ? <Spinner /> : null}
      {pending ? "Saving…" : "Save order"}
    </button>
  );
}

/**
 * Status and internal notes. Saving stays on the page -- the result is a
 * toast, and revalidation brings the list and this page up to date.
 */
export function OrderUpdateForm({
  id,
  status,
  internalNotes,
}: {
  id: number;
  status: OrderStatus;
  internalNotes: string;
}) {
  async function save(formData: FormData) {
    const result = await updateOrder(formData);
    if (result.ok) {
      toast.success("Order updated", {
        description: `Status: ${String(formData.get("status"))}`,
      });
    } else {
      toast.error(result.message);
    }
  }

  return (
    <form action={save} className="rounded-xl border border-line bg-surface p-5">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="eyebrow mb-2 block">Status</span>
        <select name="status" defaultValue={status} className="w-full rounded-lg border border-line-strong bg-elevated px-4 py-3 capitalize">
          {STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="mt-5 block">
        <span className="eyebrow mb-2 block">Internal notes</span>
        <textarea name="internal_notes" rows={5} defaultValue={internalNotes} className="w-full rounded-lg border border-line-strong bg-elevated px-4 py-3" />
      </label>
      <SaveButton />
    </form>
  );
}

/**
 * The notification status line plus its retry button. The status reads
 * "sending" the moment the button is tapped, then settles to whatever the
 * server recorded.
 */
export function OrderNotificationStatus({
  id,
  status,
  canManage,
}: {
  id: number;
  status: string;
  canManage: boolean;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [pending, startTransition] = useTransition();

  function retry() {
    startTransition(async () => {
      setOptimisticStatus("sending");
      const formData = new FormData();
      formData.set("id", String(id));
      const result = await retryOrderNotification(formData);
      if (result.ok) toast.success("Notification sent");
      else toast.error("Notification failed", { description: result.message });
    });
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="eyebrow">Email notification</p>
        <span className="inline-flex items-center gap-1.5 text-xs capitalize">
          {pending ? <Spinner className="size-3" /> : null}
          {optimisticStatus}
        </span>
      </div>
      {optimisticStatus === "failed" ? (
        <p className="mt-2 text-xs text-warn">The inquiry is saved. Internal email needs another attempt.</p>
      ) : null}
      {canManage ? (
        <button
          type="button"
          onClick={retry}
          disabled={pending}
          className={buttonClass("secondary", "mt-4 text-sm")}
        >
          {pending ? <Spinner /> : null}
          {pending ? "Sending…" : "Send notification again"}
        </button>
      ) : null}
    </>
  );
}
