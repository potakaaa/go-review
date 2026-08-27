import { describe, expect, it } from "vitest";

import {
  SLUG_LENGTH,
  SLUG_PATTERN,
  generateSlug,
  isReservedSlug,
  validateCustomSlug,
} from "@/lib/slug";

describe("generateSlug", () => {
  it("produces a six-character URL-safe slug", () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(SLUG_LENGTH);
    expect(slug).toMatch(SLUG_PATTERN);
  });

  it("never emits characters that misread in print", () => {
    const slugs = Array.from({ length: 500 }, () => generateSlug()).join("");
    for (const char of ["0", "O", "I", "l"]) {
      expect(slugs).not.toContain(char);
    }
  });

  it("is not sequential and effectively never repeats", () => {
    // 58^6 is ~38 billion, so 5000 draws colliding would mean the generator is
    // not actually random -- the failure this guards against is someone
    // swapping in a counter.
    const slugs = new Set(Array.from({ length: 5000 }, () => generateSlug()));
    expect(slugs.size).toBe(5000);
  });

  it("honours a requested length", () => {
    expect(generateSlug(10)).toHaveLength(10);
  });
});

describe("validateCustomSlug", () => {
  it("accepts letters, numbers and inner hyphens", () => {
    for (const slug of ["bella-cafe", "a7K3mP", "cafe8Q", "abc"]) {
      expect(validateCustomSlug(slug)).toEqual({ ok: true, slug });
    }
  });

  it("trims surrounding whitespace", () => {
    expect(validateCustomSlug("  bella-cafe  ")).toEqual({
      ok: true,
      slug: "bella-cafe",
    });
  });

  it("rejects slugs that are too short or too long", () => {
    expect(validateCustomSlug("ab").ok).toBe(false);
    expect(validateCustomSlug("a".repeat(33)).ok).toBe(false);
  });

  it("rejects characters that would need URL-encoding", () => {
    for (const slug of ["bella cafe", "cafe/1", "café", "a_b", "a.b"]) {
      expect(validateCustomSlug(slug).ok).toBe(false);
    }
  });

  it("rejects leading and trailing hyphens", () => {
    expect(validateCustomSlug("-cafe").ok).toBe(false);
    expect(validateCustomSlug("cafe-").ok).toBe(false);
  });

  it("rejects slugs that would shadow a real path", () => {
    for (const slug of ["login", "dashboard", "api", "DASHBOARD"]) {
      expect(validateCustomSlug(slug).ok).toBe(false);
    }
  });
});

describe("isReservedSlug", () => {
  it("compares case-insensitively, matching the lookup", () => {
    expect(isReservedSlug("Login")).toBe(true);
    expect(isReservedSlug("bella-cafe")).toBe(false);
  });
});
