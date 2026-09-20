import { describe, expect, it } from "vitest";
import { adminOrigins, isAdminHost, isLocalDevelopmentHost, isPublicPath } from "@/lib/site";

describe("site host boundaries", () => {
  const origin = "https://admin.goreview.site";

  it("recognizes only the configured production admin host", () => {
    expect(isAdminHost("admin.goreview.site", origin, false)).toBe(true);
    expect(isAdminHost("goreview.site", origin, false)).toBe(false);
    expect(isAdminHost("preview.vercel.app", origin, false)).toBe(false);
    expect(isAdminHost("admin.goreview.site.attacker.test", origin, false)).toBe(false);
  });

  // The domain move must not sign anyone out: a client whose bookmark still
  // points at the old dashboard host keeps reaching it.
  it("still honours the pre-goreview.site admin host", () => {
    expect(isAdminHost("admin.goreview.rald.site", adminOrigins(), false)).toBe(true);
    expect(isAdminHost("admin.goreview.site", adminOrigins(), false)).toBe(true);
  });

  it("matches a full host, never a suffix, across every honoured origin", () => {
    expect(isAdminHost("admin.goreview.rald.site.attacker.test", adminOrigins(), false)).toBe(false);
    expect(isAdminHost("admin.goreview.site.attacker.test", adminOrigins(), false)).toBe(false);
    expect(isAdminHost("goreview.rald.site", adminOrigins(), false)).toBe(false);
    expect(isAdminHost("", adminOrigins(), false)).toBe(false);
  });

  it("allows local hosts only during development", () => {
    expect(isLocalDevelopmentHost("localhost:3000", true)).toBe(true);
    expect(isLocalDevelopmentHost("127.0.0.1", true)).toBe(true);
    expect(isLocalDevelopmentHost("localhost.attacker.test", true)).toBe(false);
    expect(isLocalDevelopmentHost("localhost:3000", false)).toBe(false);
    expect(isAdminHost("localhost:3000", origin, true)).toBe(true);
    expect(isAdminHost("localhost:3000", origin, false)).toBe(false);
  });

  it("keeps the public surface narrow", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/images/shop-1.webp")).toBe(true);
    expect(isPublicPath("/media/stories/one")).toBe(true);
    expect(isPublicPath("/llms.txt")).toBe(true);
    expect(isPublicPath("/google-review-card")).toBe(true);
    expect(isPublicPath("/tap-cards")).toBe(true);
    expect(isPublicPath("/about")).toBe(true);
    expect(isPublicPath("/facebook-tap-card")).toBe(true);
    expect(isPublicPath("/google-tap-card")).toBe(true);
    expect(isPublicPath("/instagram-tap-card")).toBe(true);
    expect(isPublicPath("/order")).toBe(true);
    expect(isPublicPath("/privacy")).toBe(true);
    expect(isPublicPath("/resellers")).toBe(true);
    expect(isPublicPath("/guides/how-to-get-more-google-reviews")).toBe(true);
    expect(isPublicPath("/login")).toBe(false);
    expect(isPublicPath("/dashboard")).toBe(false);
  });
});
