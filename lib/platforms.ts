export const ROUTE_PLATFORMS = ["google", "facebook", "instagram"] as const;

export type RoutePlatform = (typeof ROUTE_PLATFORMS)[number];

export const PLATFORM_DETAILS: Record<
  RoutePlatform,
  { label: string; shortLabel: string; destinationLabel: string; placeholder: string; help: string }
> = {
  google: {
    label: "Google Review",
    shortLabel: "Google",
    destinationLabel: "Google Review destination",
    placeholder: "https://g.page/r/…/review",
    help: "Send taps and scans directly to the business's Google review screen.",
  },
  facebook: {
    label: "Facebook",
    shortLabel: "Facebook",
    destinationLabel: "Facebook Page destination",
    placeholder: "https://www.facebook.com/yourpage/reviews",
    help: "Use the business's Facebook Page, Reviews, or Recommendations link.",
  },
  instagram: {
    label: "Instagram",
    shortLabel: "Instagram",
    destinationLabel: "Instagram profile destination",
    placeholder: "https://www.instagram.com/yourusername/",
    help: "Send taps and scans directly to the business's Instagram profile.",
  },
};

export function isRoutePlatform(value: string): value is RoutePlatform {
  return ROUTE_PLATFORMS.includes(value as RoutePlatform);
}

/**
 * Legacy rows can briefly arrive without the additive platform column while
 * the production migration is being rolled out. Treat those rows as the
 * original Google product instead of allowing a badge render to crash a page.
 */
export function normalizeRoutePlatform(value: unknown): RoutePlatform {
  return typeof value === "string" && isRoutePlatform(value)
    ? value
    : "google";
}

export function platformLabel(platform: unknown): string {
  return PLATFORM_DETAILS[normalizeRoutePlatform(platform)].shortLabel;
}

export function normalizePlatformDestination(
  platform: RoutePlatform,
  input: string,
): string {
  const value = input.trim();
  if (platform === "instagram" && /^@?[A-Za-z0-9._]{1,30}$/.test(value)) {
    return `https://www.instagram.com/${value.replace(/^@/, "")}/`;
  }
  return value;
}
