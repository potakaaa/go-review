export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61593756338197";
export const ORDER_EMAIL = "mailto:helbirog@gmail.com?subject=Goreview%20card%20inquiry";
export const PUBLIC_ORIGIN = "https://goreview.rald.site";

export function adminOrigin(): string {
  return (process.env.ADMIN_ORIGIN || "https://admin.goreview.rald.site").replace(/\/$/, "");
}

/** Host, not forwarded-host: an arbitrary forwarded header must not grant access. */
export function isAdminHost(host: string | null, origin = adminOrigin(), development = process.env.NODE_ENV === "development"): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase();
  if (development && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) return true;
  return normalized === new URL(origin).host.toLowerCase();
}

export function isPublicPath(path: string): boolean {
  return path === "/" ||
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/icon" ||
    path === "/apple-icon" ||
    path === "/opengraph-image" ||
    path === "/google-review-card" ||
    path === "/nfc-google-review-card" ||
    path === "/google-review-qr-code" ||
    path === "/google-review-card-philippines" ||
    path === "/guides" ||
    path.startsWith("/guides/") ||
    path.startsWith("/media/stories/") ||
    path.startsWith("/images/") ||
    path.startsWith("/fonts/");
}
