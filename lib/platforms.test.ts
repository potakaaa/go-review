import { describe, expect, it } from "vitest";
import { looksLikePlatformDestination } from "@/lib/validation-client";
import {
  normalizePlatformDestination,
  normalizeRoutePlatform,
  platformLabel,
} from "@/lib/platforms";

describe("platform destinations", () => {
  it("accepts official Facebook page destinations", () => {
    expect(looksLikePlatformDestination("facebook", "https://www.facebook.com/cafe/reviews")).toBe(true);
    expect(looksLikePlatformDestination("facebook", "https://facebook.com.attacker.test/cafe")).toBe(false);
    expect(looksLikePlatformDestination("facebook", "https://facebook.com/")).toBe(false);
  });

  it("accepts profiles but not Instagram content URLs", () => {
    expect(looksLikePlatformDestination("instagram", "https://www.instagram.com/cafe.cdo/")).toBe(true);
    expect(looksLikePlatformDestination("instagram", "https://www.instagram.com/p/abc/")).toBe(false);
    expect(looksLikePlatformDestination("instagram", "https://instagram.com.attacker.test/cafe")).toBe(false);
  });

  it("normalizes an Instagram handle", () => {
    expect(normalizePlatformDestination("instagram", "@cafe.cdo")).toBe("https://www.instagram.com/cafe.cdo/");
  });

  it("treats a legacy row without a platform as Google", () => {
    expect(normalizeRoutePlatform(undefined)).toBe("google");
    expect(platformLabel(undefined)).toBe("Google");
  });
});
