import "server-only";

import {
  requirePermission,
  requireRouteReportingAccess,
} from "@/lib/permissions";
import { sortRoutesByBusinessName } from "@/lib/batch-edit";
import type { RedirectRoute } from "@/lib/database.types";
import {
  normalizeRoutePlatform,
  type RoutePlatform,
} from "@/lib/platforms";
import { ROUTE_LIST_COLUMNS, type RouteListItem } from "@/lib/route-list";

/**
 * Keep the UI compatible with legacy rows while the platform migration is
 * being applied. New writes still validate and persist an explicit platform.
 */
function normalizeRouteRow(route: RedirectRoute): RedirectRoute {
  return {
    ...route,
    platform: normalizeRoutePlatform(route.platform),
  };
}

/**
 * PostgREST caps every response at `max_rows` (1,000 on Supabase). A list that
 * must be complete reads its first page with an exact count, then fetches any
 * remaining pages together -- one round trip up to 1,000 routes, two beyond.
 */
const PAGE_SIZE = 1000;

type Page<Row> = PromiseLike<{
  data: Row[] | null;
  error: { code?: string } | null;
  count?: number | null;
}>;

async function selectAllPages<Row>(
  page: (from: number, to: number) => Page<Row>,
): Promise<{ data: Row[]; error: { code?: string } | null }> {
  const first = await page(0, PAGE_SIZE - 1);
  if (first.error) return { data: [], error: first.error };
  const rows = first.data ?? [];
  const total = first.count ?? rows.length;
  if (rows.length < PAGE_SIZE || total <= PAGE_SIZE) return { data: rows, error: null };

  const rest = await Promise.all(
    Array.from({ length: Math.ceil(total / PAGE_SIZE) - 1 }, (_, index) => {
      const from = (index + 1) * PAGE_SIZE;
      return page(from, from + PAGE_SIZE - 1);
    }),
  );
  const failed = rest.find((result) => result.error);
  if (failed) return { data: [], error: failed.error };
  return { data: rows.concat(...rest.map((result) => result.data ?? [])), error: null };
}

/**
 * Every route the caller may see, trimmed to what the list renders. Search,
 * filters and sort then run in the browser (lib/route-list.ts), so typing
 * never waits on the network. RLS still narrows rows to route assignments.
 */
export async function listRouteSummaries(): Promise<RouteListItem[]> {
  const { supabase } = await requirePermission("routes", "view");
  const { data, error } = await selectAllPages<RouteListItem>((from, to) =>
    supabase
      .from("redirect_routes")
      .select(ROUTE_LIST_COLUMNS, { count: "exact" })
      // A total order, so pages never overlap or skip a row.
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to)
      .returns<RouteListItem[]>(),
  );

  if (error) {
    console.error("[routes] list_failed", { code: error.code });
    throw new Error("Could not load routes.");
  }
  return data.map((route) => ({
    ...route,
    platform: normalizeRoutePlatform(route.platform),
  }));
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
  return data ? normalizeRouteRow(data) : null;
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
  return (data ?? []).map(normalizeRouteRow);
}

/** All routes for the deliberate bulk-edit screen, in human alphabetic order. */
export async function getRoutesForBatchEdit(): Promise<RedirectRoute[]> {
  const { supabase } = await requirePermission("routes", "manage");
  const { data, error } = await selectAllPages<RedirectRoute>((from, to) =>
    supabase
      .from("redirect_routes")
      .select("*", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, to),
  );

  if (error) {
    console.error("[routes] batch_edit_list_failed", { code: error.code });
    throw new Error("Could not load routes for batch editing.");
  }

  return sortRoutesByBusinessName(data.map(normalizeRouteRow));
}

export type RouteStats = {
  total: number;
  active: number;
  inactive: number;
  scanned: number;
  totalScans: number;
  byPlatform: Record<RoutePlatform, number>;
};

/**
 * Counted in the database (under the caller's RLS) and returned as one row, so
 * the dashboard never ships every route to the server just to count it.
 */
export async function getRouteStats(): Promise<RouteStats> {
  const { supabase } = await requireRouteReportingAccess();
  const { data, error } = await supabase.rpc("get_route_stats");
  const row = data?.[0];
  if (error || !row) {
    console.error("[routes] stats_failed", { code: error?.code });
    throw new Error("Could not load route statistics.");
  }

  // bigint columns arrive as numbers well within the safe-integer range here.
  const total = Number(row.total);
  const active = Number(row.active);
  return {
    total,
    active,
    inactive: total - active,
    scanned: Number(row.scanned),
    totalScans: Number(row.total_scans),
    byPlatform: {
      google: Number(row.google),
      facebook: Number(row.facebook),
      instagram: Number(row.instagram),
    },
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
  return (data ?? []).map(normalizeRouteRow);
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
  return (data ?? []).map(normalizeRouteRow);
}
