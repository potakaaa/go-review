import { describe, expect, it } from "vitest";

import {
  createBatchRouteSchema,
  createRouteSchema,
  destinationUrlSchema,
  looksLikeGoogleReviewUrl,
  mapsUrlSchema,
} from "@/lib/validation";

describe("destinationUrlSchema", () => {
  it("accepts an https URL", () => {
    const result = destinationUrlSchema.safeParse(
      "https://g.page/r/CabcDEF/review",
    );
    expect(result.success).toBe(true);
  });

  it("rejects an empty destination", () => {
    expect(destinationUrlSchema.safeParse("").success).toBe(false);
    expect(destinationUrlSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects http, which would show customers a 'not secure' warning", () => {
    expect(destinationUrlSchema.safeParse("http://g.page/r/x").success).toBe(
      false,
    );
  });

  it("rejects non-http schemes outright", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "ftp://example.com",
    ]) {
      expect(destinationUrlSchema.safeParse(value).success).toBe(false);
    }
  });

  it("rejects text that isn't a URL at all", () => {
    expect(destinationUrlSchema.safeParse("bella cafe").success).toBe(false);
  });
});

describe("looksLikeGoogleReviewUrl", () => {
  it("recognises the shapes Google actually hands out", () => {
    for (const url of [
      "https://g.page/r/CabcDEF/review",
      "https://maps.app.goo.gl/abc123",
      "https://goo.gl/maps/abc123",
      "https://search.google.com/local/writereview?placeid=ChIJabc",
      "https://www.google.com/maps/place/Bella+Cafe",
      "https://www.google.co.uk/maps/place/Bella+Cafe",
    ]) {
      expect(looksLikeGoogleReviewUrl(url), url).toBe(true);
    }
  });

  it("does not recognise unrelated links", () => {
    for (const url of [
      "https://example.com/review",
      "https://facebook.com/bellacafe",
      "https://notgoogle.com/maps/place/x",
      "not a url",
      "",
    ]) {
      expect(looksLikeGoogleReviewUrl(url), url).toBe(false);
    }
  });

  it("is advisory only: an unrecognised https URL still validates", () => {
    // This is the contract the create form depends on -- Google changes these
    // URLs, and a card that cannot be created is worse than an odd destination.
    const url = "https://example.com/leave-us-a-review";
    expect(looksLikeGoogleReviewUrl(url)).toBe(false);
    expect(destinationUrlSchema.safeParse(url).success).toBe(true);
  });
});

describe("mapsUrlSchema", () => {
  it("normalises a blank source to null", () => {
    expect(mapsUrlSchema.parse("")).toBeNull();
  });

  it("keeps an https Google Maps share link", () => {
    const source = "https://maps.app.goo.gl/example";
    expect(mapsUrlSchema.parse(source)).toBe(source);
  });

  it("rejects an insecure source link", () => {
    expect(mapsUrlSchema.safeParse("http://maps.app.goo.gl/example").success).toBe(
      false,
    );
  });
});

describe("createRouteSchema", () => {
  const valid = {
    business_name: "Bella's Cafe",
    destination_url: "https://g.page/r/CabcDEF/review",
    maps_url: "",
    notes: "",
    slug: "",
  };

  it("normalises blank optional fields to undefined/null", () => {
    const result = createRouteSchema.parse(valid);
    expect(result.notes).toBeNull();
    expect(result.maps_url).toBeNull();
    expect(result.slug).toBeUndefined();
  });

  it("preserves the original Maps share link", () => {
    const source = "https://maps.app.goo.gl/example";
    const result = createRouteSchema.parse({ ...valid, maps_url: source });
    expect(result.maps_url).toBe(source);
  });

  it("keeps a supplied custom slug", () => {
    const result = createRouteSchema.parse({ ...valid, slug: "bella-cafe" });
    expect(result.slug).toBe("bella-cafe");
  });

  it("rejects an invalid custom slug", () => {
    const result = createRouteSchema.safeParse({ ...valid, slug: "bella cafe" });
    expect(result.success).toBe(false);
  });

  it("requires a business name", () => {
    expect(
      createRouteSchema.safeParse({ ...valid, business_name: "  " }).success,
    ).toBe(false);
  });
});

describe("createBatchRouteSchema", () => {
  const valid = {
    business_name: "Bella's Cafe",
    destination_url: "https://g.page/r/CabcDEF/review",
    maps_url: "",
    notes: "",
    quantity: "30",
  };

  it("coerces the requested quantity to an integer", () => {
    expect(createBatchRouteSchema.parse(valid).quantity).toBe(30);
  });

  it("rejects quantities outside the supported print-run size", () => {
    expect(
      createBatchRouteSchema.safeParse({ ...valid, quantity: "1" }).success,
    ).toBe(false);
    expect(
      createBatchRouteSchema.safeParse({ ...valid, quantity: "101" }).success,
    ).toBe(false);
    expect(
      createBatchRouteSchema.safeParse({ ...valid, quantity: "3.5" }).success,
    ).toBe(false);
  });
});
