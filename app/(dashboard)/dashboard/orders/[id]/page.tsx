import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Card, buttonClass } from "@/components/ui";
import { getOrder } from "@/lib/orders";
import { requirePermission } from "@/lib/permissions";
import { updateOrder, retryOrderNotification } from "@/app/(dashboard)/dashboard/orders/actions";
import type { OrderStatus } from "@/lib/database.types";

export const metadata: Metadata = { title: "Order detail" };
const statuses: OrderStatus[] = ["new", "contacted", "confirmed", "completed", "cancelled"];

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/dashboard/orders/[id]">) {
  const access = await requirePermission("orders", "view");
  const canManage = access.profile.role === "superadmin" || access.permissions.orders.canManage;
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();
  const { saved } = await searchParams;
  const products = [["Google standee", order.standee_quantity], ["Facebook + Google Maps standee", order.duo_standee_quantity], ["Google tap card", order.google_card_quantity], ["Facebook tap card", order.facebook_card_quantity], ["Instagram tap card", order.instagram_card_quantity]].filter(([, quantity]) => Number(quantity) > 0);
  return <div className="mx-auto max-w-4xl space-y-7 pb-16">{saved ? <Alert tone="ok">Order updated.</Alert> : null}<header className="border-b border-line pb-6"><p className="font-mono text-xs text-muted">{order.reference_number}</p><h1 className="display-heading mt-3 text-4xl">{order.business_name}</h1><p className="mt-2 text-sm text-muted">{order.customer_name} · {order.barangay}, {order.city}</p></header><div className="grid gap-4 md:grid-cols-2"><Card className="p-5"><p className="eyebrow">Contact</p><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-subtle">Mobile</dt><dd><a href={`tel:${order.mobile}`}>{order.mobile}</a></dd></div>{order.email ? <div><dt className="text-subtle">Email</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd></div> : null}<div><dt className="text-subtle">Preferred</dt><dd className="capitalize">{order.preferred_contact}</dd></div></dl></Card><Card className="p-5"><p className="eyebrow">Products</p><ul className="mt-4 space-y-2 text-sm">{products.map(([label, quantity]) => <li key={String(label)} className="flex justify-between"><span>{label}</span><strong>× {quantity}</strong></li>)}</ul><p className="mt-4 border-t border-line pt-4 text-right text-xl font-semibold">₱{order.estimated_total.toLocaleString("en-PH")}</p><p className="mt-1 text-right text-xs text-subtle">Product estimate; shipping may be added.</p></Card></div>{order.customer_notes ? <Card className="p-5"><p className="eyebrow">Customer notes</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{order.customer_notes}</p></Card> : null}<Card className="p-5"><div className="flex items-center justify-between"><p className="eyebrow">Email notification</p><span className="text-xs capitalize">{order.notification_status}</span></div>{order.notification_status === "failed" ? <p className="mt-2 text-xs text-warn">The inquiry is saved. Internal email needs another attempt.</p> : null}{canManage ? <form action={retryOrderNotification} className="mt-4"><input type="hidden" name="id" value={order.id} /><button className={buttonClass("secondary", "text-sm")}>Send notification again</button></form> : null}</Card>{canManage ? <form action={updateOrder} className="rounded-xl border border-line bg-surface p-5"><input type="hidden" name="id" value={order.id} /><label className="block"><span className="eyebrow mb-2 block">Status</span><select name="status" defaultValue={order.status} className="w-full rounded-lg border border-line-strong bg-elevated px-4 py-3 capitalize">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label><label className="mt-5 block"><span className="eyebrow mb-2 block">Internal notes</span><textarea name="internal_notes" rows={5} defaultValue={order.internal_notes ?? ""} className="w-full rounded-lg border border-line-strong bg-elevated px-4 py-3" /></label><button className={buttonClass("primary", "mt-5 w-full")}>Save order</button></form> : null}</div>;
}
