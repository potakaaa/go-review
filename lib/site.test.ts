import { describe, expect, it } from "vitest";
import { isAdminHost, isPublicPath } from "@/lib/site";

describe("site host boundaries", () => {
  const origin = "https://admin.goreview.rald.site";

  it("recognizes only the configured production admin host", () => {
    expect(isAdminHost("admin.goreview.rald.site", origin, false)).toBe(true);
    expect(isAdminHost("goreview.rald.site", origin, false)).toBe(false);
    expect(isAdminHost("preview.vercel.app", origin, false)).toBe(false);
    expect(isAdminHost("admin.goreview.rald.site.attacker.test", origin, false)).toBe(false);
  });

  it("allows local hosts only during development", () => {
    expect(isAdminHost("localhost:3000", origin, true)).toBe(true);
    expect(isAdminHost("localhost:3000", origin, false)).toBe(false);
  });

  it("keeps the public surface narrow", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/images/shop-1.webp")).toBe(true);
    expect(isPublicPath("/media/stories/one")).toBe(true);
    expect(isPublicPath("/login")).toBe(false);
    expect(isPublicPath("/dashboard")).toBe(false);
  });
});
