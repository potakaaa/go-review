import { describe, expect, it } from "vitest";

import {
  incrementedRouteNames,
  sortRoutesByBusinessName,
} from "@/lib/batch-edit";

describe("incrementedRouteNames", () => {
  it("increments a supplied first number", () => {
    expect(incrementedRouteNames("restaurant-1", 3)).toEqual([
      "restaurant-1",
      "restaurant-2",
      "restaurant-3",
    ]);
  });

  it("starts at one when the seed has no number", () => {
    expect(incrementedRouteNames("restaurant", 2)).toEqual([
      "restaurant-1",
      "restaurant-2",
    ]);
  });

  it("preserves a zero-padded suffix", () => {
    expect(incrementedRouteNames("table-01", 2)).toEqual([
      "table-01",
      "table-02",
    ]);
  });
});

describe("sortRoutesByBusinessName", () => {
  it("sorts names alphabetically with natural numeric ordering", () => {
    const routes = [
      { id: "3", business_name: "Restaurant-10" },
      { id: "1", business_name: "cafe" },
      { id: "2", business_name: "Restaurant-2" },
    ];

    expect(sortRoutesByBusinessName(routes).map((route) => route.business_name)).toEqual([
      "cafe",
      "Restaurant-2",
      "Restaurant-10",
    ]);
  });
});
