import { describe, expect, it } from "vitest";

import {
  accessChoice,
  accessMapFromRows,
  applyAccess,
  createdOnLabel,
  destinationHost,
  duplicateBusinessNames,
  filterRoutes,
  groupRoutes,
  isDuplicateName,
  parseAccessPayload,
  routeGroupLabel,
  serializeAccessMap,
  summarizeAccess,
} from "@/lib/staff-route-picker";
import type { StaffRouteOption } from "@/lib/staff-types";

function route(
  id: string,
  business_name: string,
  slug: string,
  extra: Partial<StaffRouteOption> = {},
): StaffRouteOption {
  return {
    id,
    business_name,
    slug,
    publication_status: "published",
    destination_url: "https://maps.google.com/x",
    created_at: "2026-09-03T10:00:00Z",
    ...extra,
  };
}

const ROUTES = [
  route("a", "1980-cafe-iponan", "SVDLrpb-6"),
  route("b", "1980-cafe-patag", "SVDLrpb-7"),
  route("c", "aurora-elsal", "SVDLrpb-25"),
  route("d", "aurora-manolo", "SVDLrpb-23"),
  route("e", "aurora-manolo", "SVDLrpb-24"),
  route("f", "standalone", "SVDLrpb-99"),
];

describe("route grouping", () => {
  it("treats everything before the final segment as the business", () => {
    expect(routeGroupLabel("1980-cafe-iponan")).toBe("1980-cafe");
    expect(routeGroupLabel("aurora-manolo")).toBe("aurora");
    expect(routeGroupLabel("Aurora Cafe Manolo")).toBe("Aurora Cafe");
    expect(routeGroupLabel("cebu_branch_two")).toBe("cebu_branch");
  });

  it("keeps a single-segment name as its own group", () => {
    expect(routeGroupLabel("standalone")).toBe("standalone");
    expect(routeGroupLabel("  spaced  ")).toBe("spaced");
  });

  it("does not strip a leading separator into an empty group", () => {
    expect(routeGroupLabel("-orphan")).toBe("-orphan");
  });

  it("collects routes under one group per business, sorted by label", () => {
    const groups = groupRoutes(ROUTES);

    expect(groups.map((group) => group.label)).toEqual([
      "1980-cafe",
      "aurora",
      "standalone",
    ]);
    expect(groups[1]!.routes.map((item) => item.id)).toEqual(["c", "d", "e"]);
  });

  it("groups case-insensitively but keeps the first spelling", () => {
    const groups = groupRoutes([
      route("x", "Aurora-elsal", "s1"),
      route("y", "aurora-manolo", "s2"),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]!.label).toBe("Aurora");
  });
});

describe("searching", () => {
  it("matches business name or slug, ignoring case", () => {
    expect(filterRoutes(ROUTES, "AURORA").map((item) => item.id)).toEqual([
      "c",
      "d",
      "e",
    ]);
    expect(filterRoutes(ROUTES, "rpb-7").map((item) => item.id)).toEqual(["b"]);
  });

  it("returns everything for an empty query", () => {
    expect(filterRoutes(ROUTES, "   ")).toHaveLength(ROUTES.length);
  });
});

describe("access map", () => {
  it("reads existing grants and reports the choice per route", () => {
    const map = accessMapFromRows([
      { route_id: "a", access_level: "manage" },
      { route_id: "c", access_level: "view" },
    ]);

    expect(accessChoice(map, "a")).toBe("manage");
    expect(accessChoice(map, "c")).toBe("view");
    expect(accessChoice(map, "b")).toBe("none");
  });

  it("applies a choice to many routes at once without mutating the original", () => {
    const map = accessMapFromRows([{ route_id: "a", access_level: "view" }]);
    const next = applyAccess(map, ["a", "b", "c"], "manage");

    expect(next).toEqual({ a: "manage", b: "manage", c: "manage" });
    expect(map).toEqual({ a: "view" });
  });

  it("drops entries rather than storing 'none'", () => {
    const map = applyAccess({ a: "manage", b: "view" }, ["a"], "none");

    expect(map).toEqual({ b: "view" });
    expect("a" in map).toBe(false);
  });

  it("counts grants against the whole inventory", () => {
    const summary = summarizeAccess(ROUTES, { a: "manage", b: "manage", c: "view" });

    expect(summary).toEqual({ manage: 2, view: 1, granted: 3, total: 6 });
  });

  it("ignores grants for routes that no longer exist", () => {
    expect(summarizeAccess(ROUTES, { gone: "manage" }).granted).toBe(0);
  });
});

describe("duplicate names", () => {
  it("flags only the names that repeat", () => {
    const duplicated = duplicateBusinessNames(ROUTES);

    expect(isDuplicateName(duplicated, "aurora-manolo")).toBe(true);
    expect(isDuplicateName(duplicated, "AURORA-MANOLO")).toBe(true);
    expect(isDuplicateName(duplicated, "aurora-elsal")).toBe(false);
  });
});

describe("row disambiguation", () => {
  it("shortens a destination to its host", () => {
    expect(destinationHost("https://www.google.com/maps/place/x")).toBe("google.com");
    expect(destinationHost("not a url")).toBeNull();
    expect(destinationHost(null)).toBeNull();
  });

  it("shows the created day without a locale", () => {
    expect(createdOnLabel("2026-09-03T10:00:00Z")).toBe("2026-09-03");
    expect(createdOnLabel("whenever")).toBeNull();
    expect(createdOnLabel(undefined)).toBeNull();
  });
});

describe("form payload", () => {
  it("serializes granted routes in a stable order", () => {
    expect(serializeAccessMap({ c: "view", a: "manage" })).toBe(
      '[{"route_id":"a","access_level":"manage"},{"route_id":"c","access_level":"view"}]',
    );
  });

  it("round-trips through the posted field", () => {
    const map = { a: "manage", c: "view" } as const;

    expect(parseAccessPayload(serializeAccessMap(map))).toEqual([
      { route_id: "a", access_level: "manage" },
      { route_id: "c", access_level: "view" },
    ]);
  });

  it("serializes an empty grant list to an empty array", () => {
    expect(serializeAccessMap({})).toBe("[]");
    expect(parseAccessPayload("[]")).toEqual([]);
  });

  it("rejects malformed, duplicated, or unknown levels", () => {
    expect(parseAccessPayload("not json")).toEqual([]);
    expect(parseAccessPayload('{"route_id":"a"}')).toEqual([]);
    expect(parseAccessPayload(undefined)).toEqual([]);
    expect(
      parseAccessPayload('[{"route_id":"a","access_level":"owner"}]'),
    ).toEqual([]);
    expect(
      parseAccessPayload(
        '[{"route_id":"a","access_level":"view"},{"route_id":"a","access_level":"manage"}]',
      ),
    ).toEqual([{ route_id: "a", access_level: "view" }]);
  });
});
