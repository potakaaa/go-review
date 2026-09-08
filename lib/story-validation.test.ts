import { describe, expect, it } from "vitest";
import { reviewDifference, storySchema } from "@/lib/story-validation";

const valid = {
  shop_name: "MC Coffee",
  caption: "On the counter.",
  alt_text: "A Goreview card on the counter.",
  installed_on: "",
  before_count: "20",
  after_count: "31",
  before_date: "2026-08-01",
  after_date: "2026-09-01",
  source_url: "https://example.com/evidence",
  display_order: "1",
  published: true,
};

describe("shop story validation", () => {
  it("accepts complete dated review observations", () => {
    const result = storySchema.parse(valid);
    expect(reviewDifference(result)).toBe(11);
  });

  it("accepts a photo-only story without metrics", () => {
    expect(storySchema.safeParse({ ...valid, shop_name: "", before_count: "", after_count: "", before_date: "", after_date: "" }).success).toBe(true);
  });

  it("rejects incomplete or reversed result periods", () => {
    expect(storySchema.safeParse({ ...valid, after_count: "" }).success).toBe(false);
    expect(storySchema.safeParse({ ...valid, after_date: "2026-07-01" }).success).toBe(false);
  });
});
