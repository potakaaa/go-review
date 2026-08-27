import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { RedirectRoute } from "@/lib/database.types";

export type RouteFilters = {
  q?: string;
  status?: "all" | "active" | "inactive";
  sort?: "newest" | "oldest";
};

/** Narrows loose `searchParams` values into the filter shape the query wants. */
export function parseFilters(params: {
  q?: string | string[];
  status?: string | string[];
  sort?: string | string[];
}): Required<RouteFilters> {
  const first = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const status = first(params.status);
  const sort = first(params.sort);

  return {
    q: (first(params.q) ?? "").trim(),
    status: status === "active" || status === "inactive" ? status : "all",
    sort: sort === "oldest" ? "oldest" : "newest",
  };
}

/**
 * Every query below runs under the signed-in user's session, so RLS -- not an
 * `owner_id` filter in application code -- is what keeps one admin's routes
 * invisible to another.
 */
export async function listRoutes(
  filters: Required<RouteFilters>,
): Promise<RedirectRoute[]> {
  const supabase = await createClient();

  let query = supabase
    .from("redirect_routes")
    .select("*")
    .order("created_at", { ascending: filters.sort === "oldest" });

  if (filters.status !== "all") {
    query = query.eq("active", filters.status === "active");
  }

  if (filters.q) {
    // Escape PostgREST's `or` delimiters and LIKE wildcards so a search for
    // "50%" or "a,b" cannot alter the filter's structure.
    const term = filters.q.replace(/[%_,()\\]/g, "\\$&");
    query = query.or(`business_name.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Could not load routes: ${error.message}`);
  return data ?? [];
}

export async function getRoute(id: string): Promise<RedirectRoute | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load route: ${error.message}`);
  return data;
}

export type RouteStats = {
  total: number;
  active: number;
  inactive: number;
  totalScans: number;
};

/**
 * Three counts from one round-trip. At this scale (hundreds of cards, not
 * millions) counting in memory beats three separate head queries.
 */
export async function getRouteStats(): Promise<RouteStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("active, scan_count");

  if (error) throw new Error(`Could not load stats: ${error.message}`);

  const rows = data ?? [];
  const active = rows.filter((row) => row.active).length;

  return {
    total: rows.length,
    active,
    inactive: rows.length - active,
    totalScans: rows.reduce((sum, row) => sum + row.scan_count, 0),
  };
}

export async function getRecentRoutes(limit = 3): Promise<RedirectRoute[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Could not load recent routes: ${error.message}`);
  return data ?? [];
}
