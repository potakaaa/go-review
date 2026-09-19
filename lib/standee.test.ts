import { describe, expect, it } from "vitest";

import {
  STANDEE_KEY_LENGTH,
  STANDEE_KEY_PATTERN,
  STANDEE_MAX_SLOTS,
  STANDEE_MIN_SLOTS,
  duplicateDestinationIndex,
  generateStandeeKey,
  groupRoutesByStandee,
  maxStandeeBatchSize,
  standeeSlug,
  standeeZipFileName,
} from "@/lib/standee";

describe("standee identifiers", () => {
  it("generates a readable random key", () => {
    const key = generateStandeeKey();

    expect(key).toHaveLength(STANDEE_KEY_LENGTH);
    expect(key).toMatch(STANDEE_KEY_PATTERN);
  });

  it("numbers each QR slot on the stand", () => {
    expect(standeeSlug("Kx9mQ2t", 1)).toBe("Kx9mQ2t-1");
    expect(standeeSlug("Kx9mQ2t", 4)).toBe("Kx9mQ2t-4");
    expect(standeeZipFileName("Kx9mQ2t")).toBe("standee-Kx9mQ2t.zip");
  });

  it("keeps the slot bounds explicit", () => {
    expect(STANDEE_MIN_SLOTS).toBe(2);
    expect(STANDEE_MAX_SLOTS).toBe(4);
  });
});

describe("maxStandeeBatchSize", () => {
  it("fits a run inside the 100-route batch ceiling", () => {
    expect(maxStandeeBatchSize(2)).toBe(50);
    expect(maxStandeeBatchSize(3)).toBe(33);
    expect(maxStandeeBatchSize(4)).toBe(25);
  });

  it("clamps nonsense slot counts instead of dividing by zero", () => {
    expect(maxStandeeBatchSize(0)).toBe(50);
    expect(maxStandeeBatchSize(-3)).toBe(50);
    expect(maxStandeeBatchSize(99)).toBe(25);
  });
});

describe("duplicateDestinationIndex", () => {
  it("accepts different destinations on the same platform", () => {
    expect(
      duplicateDestinationIndex([
        "https://www.facebook.com/bellascafe",
        "https://www.facebook.com/bellascafe/reviews",
      ]),
    ).toBe(-1);
  });

  it("reports the second copy of a repeated destination", () => {
    expect(
      duplicateDestinationIndex([
        "https://g.page/r/abc/review",
        "https://www.facebook.com/bellascafe",
        " https://G.PAGE/r/abc/review ",
      ]),
    ).toBe(2);
  });

  it("ignores blanks, which the required-field rules already reject", () => {
    expect(duplicateDestinationIndex(["", "", "https://g.page/r/abc/review"])).toBe(
      -1,
    );
  });
});

describe("groupRoutesByStandee", () => {
  const route = (
    standee_key: string | null,
    standee_position: number | null,
    slug: string,
  ) => ({ standee_key, standee_position, slug });

  it("groups by stand and orders each stand by slot", () => {
    const groups = groupRoutesByStandee([
      route("Kx9mQ2t", 2, "Kx9mQ2t-2"),
      route("Qw4rT7y", 1, "Qw4rT7y-1"),
      route("Kx9mQ2t", 1, "Kx9mQ2t-1"),
      route("Qw4rT7y", 2, "Qw4rT7y-2"),
    ]);

    expect(groups.map((group) => group.standeeKey)).toEqual([
      "Kx9mQ2t",
      "Qw4rT7y",
    ]);
    expect(groups[0].routes.map((r) => r.slug)).toEqual([
      "Kx9mQ2t-1",
      "Kx9mQ2t-2",
    ]);
  });

  it("drops plain routes that belong to no stand", () => {
    expect(groupRoutesByStandee([route(null, null, "a7K3mP")])).toEqual([]);
  });
});
