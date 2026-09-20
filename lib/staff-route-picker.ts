import type { RouteAccessLevel } from "@/lib/database.types";
import type { StaffRouteAccessRow, StaffRouteOption } from "@/lib/staff-types";

/**
 * Pure helpers behind the staff route-access picker.
 *
 * The picker has to stay usable against the whole route inventory, so the
 * grouping, searching and bulk-apply rules live here where they can be tested
 * without rendering anything.
 */

export type RouteAccessChoice = "none" | RouteAccessLevel;

/** Only granted routes are held; an absent id means no access. */
export type RouteAccessMap = Readonly<Record<string, RouteAccessLevel>>;

export type RouteGroup = {
  /** Lower-cased grouping key. */
  key: string;
  /** The business prefix as it is spelled on the routes themselves. */
  label: string;
  routes: StaffRouteOption[];
};

export type AccessSummary = {
  manage: number;
  view: number;
  granted: number;
  total: number;
};

const SEPARATORS = /[-_\s]/;

/**
 * Route names in this workspace read as `<business>-<branch>`
 * (`1980-cafe-iponan`, `aurora-manolo`), so everything before the final
 * separator is the business. A single-segment name is its own group.
 */
export function routeGroupLabel(businessName: string): string {
  const name = businessName.trim();
  for (let index = name.length - 1; index > 0; index -= 1) {
    if (SEPARATORS.test(name[index]!)) {
      const head = name.slice(0, index).trim();
      if (head) return head;
    }
  }
  return name;
}

export function groupRoutes(routes: readonly StaffRouteOption[]): RouteGroup[] {
  const groups = new Map<string, RouteGroup>();
  for (const route of routes) {
    const label = routeGroupLabel(route.business_name);
    const key = label.toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.routes.push(route);
    } else {
      groups.set(key, { key, label, routes: [route] });
    }
  }
  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function filterRoutes(
  routes: readonly StaffRouteOption[],
  query: string,
): StaffRouteOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...routes];
  return routes.filter(
    (route) =>
      route.business_name.toLowerCase().includes(needle) ||
      route.slug.toLowerCase().includes(needle),
  );
}

export function accessMapFromRows(
  rows: readonly StaffRouteAccessRow[] | undefined,
): RouteAccessMap {
  const map: Record<string, RouteAccessLevel> = {};
  for (const row of rows ?? []) map[row.route_id] = row.access_level;
  return map;
}

export function accessChoice(
  map: RouteAccessMap,
  routeId: string,
): RouteAccessChoice {
  return map[routeId] ?? "none";
}

/** Returns a new map; "none" removes the entry rather than storing it. */
export function applyAccess(
  map: RouteAccessMap,
  routeIds: readonly string[],
  choice: RouteAccessChoice,
): RouteAccessMap {
  const next: Record<string, RouteAccessLevel> = { ...map };
  for (const id of routeIds) {
    if (choice === "none") delete next[id];
    else next[id] = choice;
  }
  return next;
}

export function summarizeAccess(
  routes: readonly StaffRouteOption[],
  map: RouteAccessMap,
): AccessSummary {
  let manage = 0;
  let view = 0;
  for (const route of routes) {
    const choice = map[route.id];
    if (choice === "manage") manage += 1;
    else if (choice === "view") view += 1;
  }
  return { manage, view, granted: manage + view, total: routes.length };
}

/**
 * Business names are not unique — two `aurora-manolo` routes differ only by
 * slug — so rows for a repeated name need a second identifying line.
 */
export function duplicateBusinessNames(
  routes: readonly StaffRouteOption[],
): ReadonlySet<string> {
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  for (const route of routes) {
    const name = route.business_name.trim().toLowerCase();
    if (seen.has(name)) duplicated.add(name);
    else seen.add(name);
  }
  return duplicated;
}

export function isDuplicateName(
  duplicated: ReadonlySet<string>,
  businessName: string,
): boolean {
  return duplicated.has(businessName.trim().toLowerCase());
}

/** Hostname without `www.`, or null when the stored destination is unusable. */
export function destinationHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** ISO day, so the disambiguating line does not depend on a locale. */
export function createdOnLabel(createdAt: string | null | undefined): string | null {
  if (!createdAt) return null;
  const day = createdAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/**
 * The picker posts one hidden field instead of one <select> per route, so the
 * form payload stays proportional to the grants rather than to the inventory.
 */
export function serializeAccessMap(map: RouteAccessMap): string {
  const rows = Object.entries(map)
    .filter(([, level]) => level === "view" || level === "manage")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([route_id, access_level]) => ({ route_id, access_level }));
  return JSON.stringify(rows);
}

/** Tolerates anything; the database re-validates the payload regardless. */
export function parseAccessPayload(raw: unknown): StaffRouteAccessRow[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const seen = new Set<string>();
  const rows: StaffRouteAccessRow[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const { route_id: routeId, access_level: level } = entry as Record<string, unknown>;
    if (typeof routeId !== "string" || seen.has(routeId)) continue;
    if (level !== "view" && level !== "manage") continue;
    seen.add(routeId);
    rows.push({ route_id: routeId, access_level: level });
  }
  return rows;
}
