import { describe, expect, it } from "vitest";

import { QR_OPTIONS, publicUrlForSlug, qrFileName } from "@/lib/qr";

const BASE = "https://go.rald.site";

describe("publicUrlForSlug", () => {
  it("builds the URL that gets printed on the card", () => {
    expect(publicUrlForSlug("a7K3mP", BASE)).toBe(
      "https://go.rald.site/r/a7K3mP",
    );
  });

  it("tolerates a trailing slash in the configured base", () => {
    // A stray slash in an env var would otherwise print //r/ onto real cards.
    expect(publicUrlForSlug("a7K3mP", "https://go.rald.site/")).toBe(
      "https://go.rald.site/r/a7K3mP",
    );
    expect(publicUrlForSlug("a7K3mP", "https://go.rald.site///")).toBe(
      "https://go.rald.site/r/a7K3mP",
    );
  });

  it("preserves slug case, which the QR encodes verbatim", () => {
    expect(publicUrlForSlug("q91LmX", BASE)).toBe(
      "https://go.rald.site/r/q91LmX",
    );
  });
});

describe("QR_OPTIONS", () => {
  it("uses high error correction and a full quiet zone", () => {
    // Cards live on restaurant tables; 'H' tolerates ~30% damage, and scanners
    // fail intermittently without the 4-module quiet zone.
    expect(QR_OPTIONS.errorCorrectionLevel).toBe("H");
    expect(QR_OPTIONS.margin).toBeGreaterThanOrEqual(4);
  });
});

describe("qrFileName", () => {
  it("makes a filesystem-safe name that still identifies the card", () => {
    expect(qrFileName("Bella's Cafe", "a7K3mP")).toBe("bellas-cafe-a7K3mP");
  });

  it("strips accents and collapses punctuation", () => {
    expect(qrFileName("Café Crème & Co.", "q91LmX")).toBe(
      "cafe-creme-co-q91LmX",
    );
  });

  it("falls back when the name has no usable characters", () => {
    expect(qrFileName("!!!", "cafe8Q")).toBe("review-card-cafe8Q");
  });
});
