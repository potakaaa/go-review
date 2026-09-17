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

export type RouteFilters = {
  q?: string;
  status?: "all" | "active" | "inactive";
  sort?: "newest" | "oldest" | "most-used";
  platform?: "all" | RoutePlatform;
};

function isMissingPlatformColumn(error: { code?: string } | null): boolean {
  return error?.code === "PGRST204" || error?.code === "42703";
}

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

/** Narrows loose `searchParams` values into the filter shape the query wants. */
export function parseFilters(params: {
  q?: string | string[];
  status?: string | string[];
  sort?: string | string[];
  platform?: string | string[];
}): Required<RouteFilters> {
  const first = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const status = first(params.status);
  const sort = first(params.sort);
  const platform = first(params.platform);

  return {
    q: (first(params.q) ?? "").trim(),
    status: status === "active" || status === "inactive" ? status : "all",
    sort:
      sort === "oldest" || sort === "most-used" ? sort : "newest",
    platform:
      platform === "google" || platform === "facebook" || platform === "instagram"
        ? platform
        : "all",
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
  if (filters.platform !== "all") query = query.eq("platform", filters.platform);

  if (filters.q) {
    // Escape PostgREST's `or` delimiters and LIKE wildcards so a search for
    // "50%" or "a,b" cannot alter the filter's structure.
    const term = filters.q.replace(/[%_,()\\]/g, "\\$&");
    query = query.or(`business_name.ilike.%${term}%,slug.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    // The platform column is additive. During a rolling deploy, an older
    // database can still serve the unfiltered route list. A legacy-safe
    // query keeps the Google filter useful and makes newer platform filters
    // return an honest empty state until the migration is applied.
    if (filters.platform !== "all" && isMissingPlatformColumn(error)) {
      let legacyQuery = supabase.from("redirect_routes").select("*");
      if (filters.sort === "most-used") {
        legacyQuery = legacyQuery
          .order("scan_count", { ascending: false })
          .order("last_scanned_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
      } else {
        legacyQuery = legacyQuery.order("created_at", {
          ascending: filters.sort === "oldest",
        });
      }
      if (filters.status !== "all") {
        legacyQuery = legacyQuery.eq("active", filters.status === "active");
      }
      if (filters.q) {
        const term = filters.q.replace(/[%_,()\\]/g, "\\$&");
        legacyQuery = legacyQuery.or(
          `business_name.ilike.%${term}%,slug.ilike.%${term}%`,
        );
      }

      const legacyResult = await legacyQuery;
      if (legacyResult.error) {
        console.error("[routes] list_failed", { code: legacyResult.error.code });
        throw new Error("Could not load routes.");
      }

      const legacyRows = (legacyResult.data ?? []).map(normalizeRouteRow);
      if (filters.platform !== "google") return [];

      const exactIndex = filters.q
        ? legacyRows.findIndex(
            (route) => route.slug_lower === filters.q.toLowerCase(),
          )
        : -1;
      if (exactIndex <= 0) return legacyRows;
      return [
        legacyRows[exactIndex],
        ...legacyRows.slice(0, exactIndex),
        ...legacyRows.slice(exactIndex + 1),
      ];
    }
    console.error("[routes] list_failed", { code: error.code });
    throw new Error("Could not load routes.");
  }

  const rows = (data ?? []).map(normalizeRouteRow);
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
  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*");

  if (error) {
    console.error("[routes] batch_edit_list_failed", { code: error.code });
    throw new Error("Could not load routes for batch editing.");
  }

  return sortRoutesByBusinessName((data ?? []).map(normalizeRouteRow));
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
 * Three counts from one round-trip. At this scale (hundreds of cards, not
 * millions) counting in memory beats three separate head queries.
 */
export async function getRouteStats(): Promise<RouteStats> {
  const { supabase } = await requireRouteReportingAccess();
  const result = await supabase
    .from("redirect_routes")
    .select("active, scan_count, platform");

  type StatsRow = {
    active: boolean;
    scan_count: number;
    platform: unknown;
  };
  let rows: StatsRow[];

  if (result.error && isMissingPlatformColumn(result.error)) {
    const legacyResult = await supabase
      .from("redirect_routes")
      .select("active, scan_count");
    if (legacyResult.error) {
      console.error("[routes] stats_failed", { code: legacyResult.error.code });
      throw new Error("Could not load route statistics.");
    }
    rows = (legacyResult.data ?? []).map((row) => ({
      ...row,
      platform: "google",
    }));
  } else {
    if (result.error) {
      console.error("[routes] stats_failed", { code: result.error.code });
      throw new Error("Could not load route statistics.");
    }
    rows = (result.data ?? []).map((row) => ({
      ...row,
      platform: normalizeRoutePlatform(row.platform),
    }));
  }

  const active = rows.filter((row) => row.active).length;
  const scanned = rows.filter((row) => row.scan_count > 0).length;

  return {
    total: rows.length,
    active,
    inactive: rows.length - active,
    scanned,
    totalScans: rows.reduce((sum, row) => sum + row.scan_count, 0),
    byPlatform: {
      google: rows.filter((row) => row.platform === "google").length,
      facebook: rows.filter((row) => row.platform === "facebook").length,
      instagram: rows.filter((row) => row.platform === "instagram").length,
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
