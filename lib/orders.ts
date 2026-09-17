import "server-only";

import { requirePermission } from "@/lib/permissions";
import type { OrderInquiry, OrderStatus } from "@/lib/database.types";

export async function listOrders(status?: OrderStatus): Promise<OrderInquiry[]> {
  const { supabase } = await requirePermission("orders", "view");
  let query = supabase.from("order_inquiries").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error("Could not load orders.");
  return data ?? [];
}

export async function getOrder(id: number): Promise<OrderInquiry | null> {
  const { supabase } = await requirePermission("orders", "view");
  const { data, error } = await supabase.from("order_inquiries").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load this order.");
  return data;
}
