import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { getOrder } from "@/lib/orders";
import { requirePermission } from "@/lib/permissions";
import { OrderNotificationStatus, OrderUpdateForm } from "./order-forms";

export const metadata: Metadata = { title: "Order detail" };

export default async function OrderDetailPage({ params }: PageProps<"/dashboard/orders/[id]">) {
  const access = await requirePermission("orders", "view");
  const canManage = access.profile.role === "superadmin" || access.permissions.orders.canManage;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  const products = [["Google standee", order.standee_quantity], ["Facebook + Google Maps standee", order.duo_standee_quantity], ["Google tap card", order.google_card_quantity], ["Facebook tap card", order.facebook_card_quantity], ["Instagram tap card", order.instagram_card_quantity]].filter(([, quantity]) => Number(quantity) > 0);
  return <div className="mx-auto max-w-4xl space-y-7 pb-16"><header className="border-b border-line pb-6"><p className="font-mono text-xs text-muted">{order.reference_number}</p><h1 className="display-heading mt-3 text-4xl">{order.business_name}</h1><p className="mt-2 text-sm text-muted">{order.customer_name} · {order.barangay}, {order.city}</p></header><div className="grid gap-4 md:grid-cols-2"><Card className="p-5"><p className="eyebrow">Contact</p><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-subtle">Mobile</dt><dd><a href={`tel:${order.mobile}`}>{order.mobile}</a></dd></div>{order.email ? <div><dt className="text-subtle">Email</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd></div> : null}<div><dt className="text-subtle">Preferred</dt><dd className="capitalize">{order.preferred_contact}</dd></div></dl></Card><Card className="p-5"><p className="eyebrow">Products</p><ul className="mt-4 space-y-2 text-sm">{products.map(([label, quantity]) => <li key={String(label)} className="flex justify-between"><span>{label}</span><strong>× {quantity}</strong></li>)}</ul><p className="mt-4 border-t border-line pt-4 text-right text-xl font-semibold">₱{order.estimated_total.toLocaleString("en-PH")}</p><p className="mt-1 text-right text-xs text-subtle">Product estimate; shipping may be added.</p></Card></div>{order.customer_notes ? <Card className="p-5"><p className="eyebrow">Customer notes</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{order.customer_notes}</p></Card> : null}<Card className="p-5"><OrderNotificationStatus id={order.id} status={order.notification_status} canManage={canManage} /></Card>{canManage ? <OrderUpdateForm id={order.id} status={order.status} internalNotes={order.internal_notes ?? ""} /> : null}</div>;
}
