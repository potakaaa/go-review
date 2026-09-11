/**
 * Browser-safe Google Review URL checks.
 *
 * Keep this module free of server-only schemas and validation dependencies so
 * admin forms do not ship the full Zod bundle just to show a warning.
 */

const GOOGLE_REVIEW_PATTERNS: Array<(url: URL) => boolean> = [
  (url) => url.hostname === "g.page",
  (url) => url.hostname === "maps.app.goo.gl",
  (url) => url.hostname === "goo.gl" && url.pathname.startsWith("/maps"),
  (url) =>
    url.hostname === "search.google.com" &&
    url.pathname.includes("/local/writereview"),
  (url) =>
    /^(?:[a-z0-9-]+\.)?google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})$/i.test(
      url.hostname,
    ) &&
    (url.pathname.startsWith("/maps") ||
      url.searchParams.has("placeid") ||
      url.searchParams.has("place_id")),
];

/** Exact allowlist shared by UI validation and server-side mutations. */
export function looksLikeGoogleReviewUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return false;
  }
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password
  ) {
    return false;
  }
  return GOOGLE_REVIEW_PATTERNS.some((matches) => matches(url));
}

/** Client-side affordance; the server and database remain authoritative. */
export function destinationNeedsAcknowledgement(input: string): boolean {
  const trimmed = input.trim();
  return (
    trimmed.length > 0 &&
    trimmed.startsWith("https://") &&
    !looksLikeGoogleReviewUrl(trimmed)
  );
}
