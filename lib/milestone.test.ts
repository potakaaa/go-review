import { describe, expect, it } from "vitest";

import {
  averageScansPerCard,
  milestoneFileName,
  scanMilestone,
} from "./milestone";

describe("scanMilestone", () => {
  it("shows small counts exactly, with no plus to overstate them", () => {
    expect(scanMilestone(0)).toEqual({ value: 0, label: "0", exact: true });
    expect(scanMilestone(49)).toEqual({ value: 49, label: "49", exact: true });
  });

  it("rounds down to the nearest 50 so the card never overclaims", () => {
    expect(scanMilestone(50).label).toBe("50+");
    expect(scanMilestone(237).label).toBe("200+");
    expect(scanMilestone(299).label).toBe("250+");
  });

  it("groups thousands", () => {
    expect(scanMilestone(1_234).label).toBe("1,200+");
  });

  it("ignores fractional and negative counts", () => {
    expect(scanMilestone(237.9).label).toBe("200+");
    expect(scanMilestone(-5).label).toBe("0");
  });

  it("names the download after the rounded figure", () => {
    expect(milestoneFileName(scanMilestone(237))).toBe("goreview-200-scans.png");
  });
});

describe("averageScansPerCard", () => {
  it("averages over the cards that have been used", () => {
    expect(averageScansPerCard(237, 18)).toBe(13);
  });

  it("has nothing to report before the first scan", () => {
    expect(averageScansPerCard(0, 0)).toBeNull();
  });
});
