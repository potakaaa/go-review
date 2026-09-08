import "server-only";

import {
  requirePermission,
  requireRouteReportingAccess,
} from "@/lib/permissions";
import type { RedirectRoute } from "@/lib/database.types";

export type RouteFilters = {
  q?: string;
  status?: "all" | "active" | "inactive";
  sort?: "newest" | "oldest" | "most-used";
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
    sort:
      sort === "oldest" || sort === "most-used" ? sort : "newest",
  };
}

/**
 * Every query independently requires approved staff access and MFA. RLS repeats
 * the same boundary in the database and narrows rows to route assignments.
 */
export async function listRoutes(
  filters: Required<RouteFilters>,
): Promise<RedirectRoute[]> {
  const { supabase } = await requirePermission("routes", "view");

  let query = supabase
    .from("redirect_routes")
    .select("*");

  if (filters.sort === "most-used") {
    query = query
      .order("scan_count", { ascending: false })
      .order("last_scanned_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", {
      ascending: filters.sort === "oldest",
    });
  }

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
  if (error) {
    console.error("[routes] list_failed", { code: error.code });
    throw new Error("Could not load routes.");
  }

  const rows = data ?? [];
  if (!filters.q) return rows;

  // Exact route-number searches should win over a partial business-name hit,
  // regardless of the selected sort order.
  const exactIndex = rows.findIndex(
    (route) => route.slug_lower === filters.q.toLowerCase(),
  );
  if (exactIndex <= 0) return rows;

  return [
    rows[exactIndex],
    ...rows.slice(0, exactIndex),
    ...rows.slice(exactIndex + 1),
  ];
}

export async function getRoute(id: string): Promise<RedirectRoute | null> {
  const { supabase } = await requirePermission("routes", "view");
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[routes] detail_failed", { code: error.code });
    throw new Error("Could not load route.");
  }
  return data;
}

export async function getBatchRoutes(batchKey: string): Promise<RedirectRoute[]> {
  const { supabase } = await requirePermission("routes", "view");
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .eq("batch_key", batchKey)
    .order("batch_position", { ascending: true });

  if (error) {
    console.error("[routes] batch_failed", { code: error.code });
    throw new Error("Could not load batch routes.");
  }
  return data ?? [];
}

export type RouteStats = {
  total: number;
  active: number;
  inactive: number;
  scanned: number;
  totalScans: number;
};

/**
 * Three counts from one round-trip. At this scale (hundreds of cards, not
 * millions) counting in memory beats three separate head queries.
 */
export async function getRouteStats(): Promise<RouteStats> {
  const { supabase } = await requireRouteReportingAccess();
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("active, scan_count");

  if (error) {
    console.error("[routes] stats_failed", { code: error.code });
    throw new Error("Could not load route statistics.");
  }

  const rows = data ?? [];
  const active = rows.filter((row) => row.active).length;
  const scanned = rows.filter((row) => row.scan_count > 0).length;

  return {
    total: rows.length,
    active,
    inactive: rows.length - active,
    scanned,
    totalScans: rows.reduce((sum, row) => sum + row.scan_count, 0),
  };
}

export async function getMostUsedRoutes(limit = 10): Promise<RedirectRoute[]> {
  const { supabase } = await requirePermission("analytics", "view");
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .order("scan_count", { ascending: false })
    .order("last_scanned_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    console.error("[routes] analytics_failed", { code: error.code });
    throw new Error("Could not load usage analytics.");
  }
  return data ?? [];
}

export async function getRecentRoutes(limit = 3): Promise<RedirectRoute[]> {
  const { supabase } = await requireRouteReportingAccess();
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[routes] recent_failed", { code: error.code });
    throw new Error("Could not load recent routes.");
  }
  return data ?? [];
}
