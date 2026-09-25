import type { RedirectRoute } from "@/lib/database.types";
import type { RoutePlatform } from "@/lib/platforms";

/**
 * Search, filter and sort for the routes list, shared by the server (to render
 * the first paint for a shared or refreshed URL) and the browser (to answer
 * every keystroke without a round trip). Pure, so it is also unit-tested.
 */

/** Only the columns a route card and these filters read. */
export const ROUTE_LIST_COLUMNS =
  "id, slug, slug_lower, business_name, destination_url, platform, active, publication_status, locked, scan_count, last_scanned_at, created_at, standee_key, standee_position, batch_key, batch_position";

export type RouteListItem = Pick<
  RedirectRoute,
  | "id"
  | "slug"
  | "slug_lower"
  | "business_name"
  | "destination_url"
  | "platform"
  | "active"
  | "publication_status"
  | "locked"
  | "scan_count"
  | "last_scanned_at"
  | "created_at"
  | "standee_key"
  | "standee_position"
  | "batch_key"
  | "batch_position"
>;

export type RouteFilters = {
  q: string;
  status: "all" | "active" | "inactive";
  sort: "newest" | "oldest" | "most-used";
  platform: "all" | RoutePlatform;
};

export const DEFAULT_ROUTE_FILTERS: RouteFilters = {
  q: "",
  status: "all",
  sort: "newest",
  platform: "all",
};

type ParamValue = string | string[] | null | undefined;

/** Narrows loose `searchParams` values into the filter shape. */
export function parseFilters(params: {
  q?: ParamValue;
  status?: ParamValue;
  sort?: ParamValue;
  platform?: ParamValue;
}): RouteFilters {
  const first = (value: ParamValue) =>
    (Array.isArray(value) ? value[0] : value) ?? undefined;

  const status = first(params.status);
  const sort = first(params.sort);
  const platform = first(params.platform);

  return {
    q: (first(params.q) ?? "").trim(),
    status: status === "active" || status === "inactive" ? status : "all",
    sort: sort === "oldest" || sort === "most-used" ? sort : "newest",
    platform:
      platform === "google" || platform === "facebook" || platform === "instagram"
        ? platform
        : "all",
  };
}

/** The query string for a filter state, omitting every default. */
export function filtersToSearch(filters: RouteFilters): string {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.platform !== "all") params.set("platform", filters.platform);
  return params.toString();
}

export function isFiltered(filters: RouteFilters): boolean {
  return (
    filters.q.trim() !== "" ||
    filters.status !== "all" ||
    filters.platform !== "all"
  );
}

function time(value: string | null): number {
  return value ? Date.parse(value) : Number.NEGATIVE_INFINITY;
}

function compare(sort: RouteFilters["sort"]) {
  return (left: RouteListItem, right: RouteListItem): number => {
    if (sort === "most-used") {
      return (
        right.scan_count - left.scan_count ||
        // Nulls last: a route never scanned sorts after any scanned one.
        time(right.last_scanned_at) - time(left.last_scanned_at) ||
        time(right.created_at) - time(left.created_at) ||
        left.id.localeCompare(right.id)
      );
    }
    const byCreated = time(left.created_at) - time(right.created_at);
    return (
      (sort === "oldest" ? byCreated : -byCreated) ||
      left.id.localeCompare(right.id)
    );
  };
}

/**
 * Case-insensitive substring match on business name or slug -- the same rule
 * the database `ilike` search used. An exact route-number match is lifted to
 * the top regardless of sort, so typing a printed card's slug finds that card
 * first.
 */
export function filterRoutes(
  routes: readonly RouteListItem[],
  filters: RouteFilters,
): RouteListItem[] {
  const term = filters.q.trim().toLowerCase();

  const matches = routes.filter(
    (route) =>
      (filters.status === "all" ||
        route.active === (filters.status === "active")) &&
      (filters.platform === "all" || route.platform === filters.platform) &&
      (!term ||
        route.business_name.toLowerCase().includes(term) ||
        route.slug_lower.includes(term)),
  );
  matches.sort(compare(filters.sort));

  if (!term) return matches;
  const exactIndex = matches.findIndex((route) => route.slug_lower === term);
  if (exactIndex <= 0) return matches;
  const [exact] = matches.splice(exactIndex, 1);
  return [exact, ...matches];
}
