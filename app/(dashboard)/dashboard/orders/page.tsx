import type { Metadata } from "next";
import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";
import { listOrders } from "@/lib/orders";
import type { OrderStatus } from "@/lib/database.types";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };
const statuses: OrderStatus[] = ["new", "contacted", "confirmed", "completed", "cancelled"];

export default async function OrdersPage({ searchParams }: PageProps<"/dashboard/orders">) {
  const params = await searchParams;
  const raw = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = statuses.includes(raw as OrderStatus) ? raw as OrderStatus : undefined;
  const orders = await listOrders(status);
  return <div className="space-y-8 pb-16"><header className="border-b border-line pb-7"><p className="eyebrow">Customer pipeline</p><h1 className="display-heading mt-3 text-5xl">Orders</h1><p className="mt-3 text-sm text-muted">Inquiry details, follow-up status, and internal notes.</p></header><nav className="flex flex-wrap gap-2"><Link href="/dashboard/orders" className="rounded-full border border-line px-3 py-2 text-xs">All</Link>{statuses.map((item) => <Link key={item} href={`/dashboard/orders?status=${item}`} className="rounded-full border border-line px-3 py-2 text-xs capitalize">{item}</Link>)}</nav>{orders.length === 0 ? <EmptyState title="No orders here" description="New website inquiries will appear here." /> : <div className="grid gap-3 lg:grid-cols-2">{orders.map((order) => <Link key={order.id} href={`/dashboard/orders/${order.id}`}><Card className="p-5 transition hover:border-line-strong"><div className="flex justify-between gap-3"><div><p className="font-mono text-xs text-muted">{order.reference_number}</p><h2 className="mt-2 font-medium">{order.business_name}</h2><p className="mt-1 text-sm text-muted">{order.customer_name} · {order.city}</p></div><span className="h-fit rounded-full border border-line px-2 py-1 text-[10px] uppercase">{order.status}</span></div><div className="mt-5 flex justify-between border-t border-line pt-4 text-sm"><span>{formatDate(order.created_at)}</span><strong>₱{order.estimated_total.toLocaleString("en-PH")}</strong></div></Card></Link>)}</div>}</div>;
}
