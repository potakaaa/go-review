export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61593756338197";
export const ORDER_EMAIL = "mailto:helbirog@gmail.com?subject=Goreview%20card%20inquiry";
export const RESELLER_EMAIL = "mailto:helbirog@gmail.com?subject=Goreview%20reseller%20inquiry";
export const PUBLIC_ORIGIN = "https://goreview.site";

/**
 * Admin hosts kept alive from before the goreview.site move.
 *
 * Bookmarks outlive deploys. A client who saved the old dashboard URL must keep
 * reaching it, so these stay recognised alongside the canonical origin. Drop an
 * entry only once nobody is signing in through it.
 */
const LEGACY_ADMIN_ORIGINS = ["https://admin.goreview.rald.site"] as const;

export function adminOrigin(): string {
  return (process.env.ADMIN_ORIGIN || "https://admin.goreview.site").replace(/\/$/, "");
}

/** The canonical admin origin first, then the hosts still honoured. */
export function adminOrigins(): readonly string[] {
  return [adminOrigin(), ...LEGACY_ADMIN_ORIGINS];
}

export function isLocalDevelopmentHost(
  host: string | null,
  development = process.env.NODE_ENV === "development",
): boolean {
  return development && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host?.toLowerCase() ?? "");
}

/** Host, not forwarded-host: an arbitrary forwarded header must not grant access. */
export function isAdminHost(
  host: string | null,
  origins: string | readonly string[] = adminOrigins(),
  development = process.env.NODE_ENV === "development",
): boolean {
  if (!host) return false;
  if (isLocalDevelopmentHost(host, development)) return true;
  const normalized = host.toLowerCase();
  // Full-host equality per candidate, never a suffix test: `admin.example.com`
  // must not match `admin.example.com.attacker.test`.
  const candidates = typeof origins === "string" ? [origins] : origins;
  return candidates.some((origin) => normalized === new URL(origin).host.toLowerCase());
}

export function isPublicPath(path: string): boolean {
  return path === "/" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/llms.txt" ||
    path === "/icon" ||
    path === "/apple-icon" ||
    path === "/opengraph-image" ||
    path === "/google-review-card" ||
    path === "/nfc-google-review-card" ||
    path === "/google-review-qr-code" ||
    path === "/google-review-card-philippines" ||
    path === "/facebook-tap-card" ||
    path === "/instagram-tap-card" ||
    path === "/order" ||
    path === "/privacy" ||
    path === "/resellers" ||
    path === "/guides" ||
    path.startsWith("/guides/") ||
    path.startsWith("/media/stories/") ||
    path.startsWith("/images/") ||
    path.startsWith("/fonts/");
}
