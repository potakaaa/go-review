"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOrderNotification } from "@/lib/order-email";
import type { OrderStatus } from "@/lib/database.types";

const STATUSES: OrderStatus[] = ["new", "contacted", "confirmed", "completed", "cancelled"];

/** Returned rather than thrown, so the page can toast it and stay put. */
export type OrderActionResult = { ok: true } | { ok: false; message: string };

export async function updateOrder(formData: FormData): Promise<OrderActionResult> {
  const { supabase } = await requirePermission("orders", "manage");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  const internalNotes = String(formData.get("internal_notes") ?? "").trim();
  if (!Number.isSafeInteger(id) || !STATUSES.includes(status) || internalNotes.length > 4000) notFound();
  const { error } = await supabase.from("order_inquiries").update({ status, internal_notes: internalNotes || null }).eq("id", id);
  if (error) return { ok: false, message: "Could not update this order. Please try again." };
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
  return { ok: true };
}

export async function retryOrderNotification(formData: FormData): Promise<OrderActionResult> {
  await requirePermission("orders", "manage");
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id)) notFound();
  const admin = createAdminClient();
  const { data: order } = await admin.from("order_inquiries").select("*").eq("id", id).maybeSingle();
  if (!order) notFound();
  const result = await sendOrderNotification(order);
  await admin.from("order_inquiries").update({
    notification_status: result.ok ? "sent" : "failed",
    notification_attempts: order.notification_attempts + 1,
    notification_sent_at: result.ok ? new Date().toISOString() : order.notification_sent_at,
    notification_error: result.ok ? null : result.error,
  }).eq("id", id);
  revalidatePath(`/dashboard/orders/${id}`);
  return result.ok
    ? { ok: true }
    : { ok: false, message: "The notification email could not be sent. The order is still saved." };
}
