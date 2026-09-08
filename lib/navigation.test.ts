import { describe, expect, it } from "vitest";

import { safeNextPath } from "@/lib/navigation";

describe("safeNextPath", () => {
  it("keeps same-origin absolute paths", () => {
    expect(safeNextPath("/dashboard/routes?status=active")).toBe(
      "/dashboard/routes?status=active",
    );
  });

  it("rejects external and scheme-relative destinations", () => {
    for (const value of [
      "https://attacker.test",
      "//attacker.test",
      "/\\attacker.test",
      "dashboard",
      null,
    ]) {
      expect(safeNextPath(value)).toBe("/dashboard");
    }
  });
});
