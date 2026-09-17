import "server-only";

import { Resend } from "resend";
import type { OrderInquiry } from "@/lib/database.types";

const DEFAULT_RECIPIENT = "helbirog@gmail.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character] ?? character);
}

export async function sendOrderNotification(order: OrderInquiry) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.ORDER_NOTIFICATION_FROM?.trim();
  const to = process.env.ORDER_NOTIFICATION_TO?.trim() || DEFAULT_RECIPIENT;
  if (!apiKey || !from) {
    return { ok: false as const, error: "Order email is not configured." };
  }

  const products = [
    ["Google standee", order.standee_quantity],
    ["Google tap card", order.google_card_quantity],
    ["Facebook tap card", order.facebook_card_quantity],
    ["Instagram tap card", order.instagram_card_quantity],
  ].filter(([, quantity]) => Number(quantity) > 0);
  const lines = products.map(([label, quantity]) => `${label}: ${quantity}`).join("\n");
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: order.email ?? undefined,
    subject: `New Goreview inquiry ${order.reference_number}`,
    text: `${order.reference_number}\n${order.customer_name} — ${order.business_name}\n${order.mobile}${order.email ? `\n${order.email}` : ""}\n${order.barangay}, ${order.city}\n\n${lines}\n\nEstimated product total: ₱${order.estimated_total.toLocaleString("en-PH")}\nDelivery: ${order.delivery_area === "cdo" ? "Within CDO" : "Outside CDO — quote shipping"}\n\nNotes: ${order.customer_notes ?? "None"}`,
    html: `<h1>New order inquiry ${escapeHtml(order.reference_number)}</h1><p><strong>${escapeHtml(order.customer_name)}</strong><br>${escapeHtml(order.business_name)}<br>${escapeHtml(order.mobile)}${order.email ? `<br>${escapeHtml(order.email)}` : ""}<br>${escapeHtml(order.barangay)}, ${escapeHtml(order.city)}</p><ul>${products.map(([label, quantity]) => `<li>${escapeHtml(String(label))}: ${quantity}</li>`).join("")}</ul><p><strong>Estimated product total: ₱${order.estimated_total.toLocaleString("en-PH")}</strong></p><p>${order.delivery_area === "cdo" ? "Free delivery within CDO applies when the tap-card minimum is met." : "Outside CDO — confirm shipping separately."}</p><p>Notes: ${escapeHtml(order.customer_notes ?? "None")}</p>`,
  });
  return error
    ? { ok: false as const, error: error.message.slice(0, 500) }
    : { ok: true as const };
}
