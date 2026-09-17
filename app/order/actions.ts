"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { orderInquirySchema } from "@/lib/order-validation";
import { sendOrderNotification } from "@/lib/order-email";

export type OrderFormState = {
  status?: "success" | "error";
  reference?: string;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

export async function submitOrderInquiry(
  _previous: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const fields = [
    "customer_name", "business_name", "mobile", "email", "preferred_contact",
    "city", "barangay", "delivery_area", "standee_quantity", "google_card_quantity",
    "facebook_card_quantity", "instagram_card_quantity", "customer_notes",
  ] as const;
  const values = Object.fromEntries(fields.map((key) => [key, String(formData.get(key) ?? "")])) as Record<string, string>;
  const parsed = orderInquirySchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "form");
      errors[field] ??= issue.message;
    }
    return { status: "error", errors, values };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("order_inquiries")
    .insert(parsed.data)
    .select("*")
    .single();

  if (error || !order) {
    console.error("[orders] inquiry_create_failed", { code: error?.code });
    return { status: "error", message: "We couldn't save your inquiry. Please try again.", values };
  }

  const delivery = await sendOrderNotification(order);
  await admin
    .from("order_inquiries")
    .update({
      notification_status: delivery.ok ? "sent" : "failed",
      notification_attempts: 1,
      notification_sent_at: delivery.ok ? new Date().toISOString() : null,
      notification_error: delivery.ok ? null : delivery.error,
    })
    .eq("id", order.id);

  return {
    status: "success",
    reference: order.reference_number,
    message: "Your inquiry is in. We'll contact you to confirm availability, delivery, payment, and your full address.",
  };
}
