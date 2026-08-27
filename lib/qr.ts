import { redirectBaseUrl } from "@/lib/env";

/**
 * The single source of truth for what a card's QR code encodes.
 *
 * The preview, the PNG download, the SVG download, the copy button and the
 * tests all call this, so a printed card can never disagree with what the
 * dashboard shows.
 */
export function publicUrlForSlug(slug: string, baseUrl?: string): string {
  const base = (baseUrl ?? redirectBaseUrl()).replace(/\/+$/, "");
  return `${base}/r/${slug}`;
}

/**
 * Options shared by every rendering path.
 *
 * `errorCorrectionLevel: "H"` tolerates ~30% damage -- cards live in the wet,
 * greasy conditions of a restaurant table. `margin: 4` is the quiet zone the QR
 * spec requires; scanners fail intermittently without it.
 */
export const QR_OPTIONS = {
  errorCorrectionLevel: "H",
  margin: 4,
  color: { dark: "#000000", light: "#FFFFFF" },
} as const;

/** Pixel width used for the downloadable PNG -- large enough for print. */
export const QR_PNG_SIZE = 1024;

/** `Bella's Cafe` + `a7K3mP` -> `bellas-cafe-a7K3mP`. */
export function qrFileName(businessName: string, slug: string): string {
  const base = businessName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    // Apostrophes vanish rather than becoming separators: "Bella's" should
    // read as "bellas", not "bella-s".
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base ? `${base}-${slug}` : `review-card-${slug}`;
}
