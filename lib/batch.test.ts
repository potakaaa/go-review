import { describe, expect, it } from "vitest";

import {
  BATCH_KEY_LENGTH,
  BATCH_KEY_PATTERN,
  BATCH_MAX_SIZE,
  BATCH_MIN_SIZE,
  batchSlug,
  batchZipFileName,
  generateBatchKey,
} from "@/lib/batch";

describe("batch identifiers", () => {
  it("generates a readable random prefix", () => {
    const key = generateBatchKey();

    expect(key).toHaveLength(BATCH_KEY_LENGTH);
    expect(key).toMatch(BATCH_KEY_PATTERN);
  });

  it("builds numbered slugs and a safe archive name", () => {
    expect(batchSlug("akfiuex", 1)).toBe("akfiuex-1");
    expect(batchSlug("akfiuex", 30)).toBe("akfiuex-30");
    expect(batchZipFileName("akfiuex")).toBe("review-routes-akfiuex.zip");
  });

  it("keeps the server-side batch bounds explicit", () => {
    expect(BATCH_MIN_SIZE).toBe(2);
    expect(BATCH_MAX_SIZE).toBe(100);
  });
});
