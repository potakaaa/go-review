import { describe, expect, it } from "vitest";

import {
  DEFAULT_ROUTE_FILTERS,
  filterRoutes,
  filtersToSearch,
  isFiltered,
  parseFilters,
  type RouteListItem,
} from "@/lib/route-list";

function route(overrides: Partial<RouteListItem> & { id: string }): RouteListItem {
  const slug = overrides.slug ?? overrides.id;
  return {
    slug,
    slug_lower: slug.toLowerCase(),
    business_name: `Business ${overrides.id}`,
    destination_url: "https://g.page/r/example/review",
    platform: "google",
    active: true,
    publication_status: "published",
    locked: false,
    scan_count: 0,
    last_scanned_at: null,
    created_at: "2026-09-01T00:00:00Z",
    standee_key: null,
    standee_position: null,
    batch_key: null,
    batch_position: null,
    ...overrides,
  };
}

const ROUTES = [
  route({ id: "a", business_name: "Bella's Cafe", slug: "bella", created_at: "2026-09-01T00:00:00Z", scan_count: 5, last_scanned_at: "2026-09-10T00:00:00Z" }),
  route({ id: "b", business_name: "Cafe Uno", slug: "cafe", created_at: "2026-09-03T00:00:00Z", scan_count: 5, last_scanned_at: "2026-09-12T00:00:00Z", active: false }),
  route({ id: "c", business_name: "Salon Dos", slug: "Salon-2", created_at: "2026-09-02T00:00:00Z", scan_count: 40, platform: "facebook" }),
  route({ id: "d", business_name: "Grill Tres", slug: "grill", created_at: "2026-09-04T00:00:00Z", scan_count: 5 }),
];

const ids = (routes: RouteListItem[]) => routes.map((item) => item.id);

describe("parseFilters", () => {
  it("falls back to defaults for missing or unknown values", () => {
    expect(parseFilters({})).toEqual(DEFAULT_ROUTE_FILTERS);
    expect(parseFilters({ status: "bogus", sort: "x", platform: "tiktok" })).toEqual(DEFAULT_ROUTE_FILTERS);
  });

  it("takes the first value of repeated params and trims the query", () => {
    expect(parseFilters({ q: ["  cafe ", "x"], status: ["inactive"], platform: "facebook", sort: "most-used" })).toEqual({
      q: "cafe",
      status: "inactive",
      sort: "most-used",
      platform: "facebook",
    });
  });
});

describe("filtersToSearch", () => {
  it("omits defaults and round-trips through parseFilters", () => {
    expect(filtersToSearch(DEFAULT_ROUTE_FILTERS)).toBe("");
    const filters = { q: "cafe", status: "active", sort: "oldest", platform: "google" } as const;
    const search = filtersToSearch(filters);
    expect(parseFilters(Object.fromEntries(new URLSearchParams(search)))).toEqual(filters);
  });
});

describe("isFiltered", () => {
  it("ignores sort order", () => {
    expect(isFiltered({ ...DEFAULT_ROUTE_FILTERS, sort: "oldest" })).toBe(false);
    expect(isFiltered({ ...DEFAULT_ROUTE_FILTERS, q: " " })).toBe(false);
    expect(isFiltered({ ...DEFAULT_ROUTE_FILTERS, status: "active" })).toBe(true);
  });
});

describe("filterRoutes", () => {
  it("sorts newest first by default and oldest on request", () => {
    expect(ids(filterRoutes(ROUTES, DEFAULT_ROUTE_FILTERS))).toEqual(["d", "b", "c", "a"]);
    expect(ids(filterRoutes(ROUTES, { ...DEFAULT_ROUTE_FILTERS, sort: "oldest" }))).toEqual(["a", "c", "b", "d"]);
  });

  it("sorts most used by scans, then latest scan with never-scanned last", () => {
    expect(ids(filterRoutes(ROUTES, { ...DEFAULT_ROUTE_FILTERS, sort: "most-used" }))).toEqual(["c", "b", "a", "d"]);
  });

  it("matches business name or slug case-insensitively", () => {
    expect(ids(filterRoutes(ROUTES, { ...DEFAULT_ROUTE_FILTERS, q: "CAFE" }))).toEqual(["b", "a"]);
    expect(ids(filterRoutes(ROUTES, { ...DEFAULT_ROUTE_FILTERS, q: "salon-2" }))).toEqual(["c"]);
  });

  it("lifts an exact slug match to the top regardless of sort", () => {
    const withExact = [...ROUTES, route({ id: "e", business_name: "Old Cafe", slug: "cafe-old", created_at: "2026-09-09T00:00:00Z" })];
    expect(ids(filterRoutes(withExact, { ...DEFAULT_ROUTE_FILTERS, q: "cafe" }))).toEqual(["b", "e", "a"]);
  });

  it("combines status and platform filters", () => {
    expect(ids(filterRoutes(ROUTES, { ...DEFAULT_ROUTE_FILTERS, status: "inactive" }))).toEqual(["b"]);
    expect(ids(filterRoutes(ROUTES, { ...DEFAULT_ROUTE_FILTERS, status: "active", platform: "facebook" }))).toEqual(["c"]);
  });

  it("does not reorder the input array", () => {
    const input = [...ROUTES];
    filterRoutes(input, DEFAULT_ROUTE_FILTERS);
    expect(ids(input)).toEqual(["a", "b", "c", "d"]);
  });
});
