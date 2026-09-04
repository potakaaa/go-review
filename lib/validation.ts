import { z } from "zod";

import { BATCH_MAX_SIZE, BATCH_MIN_SIZE } from "@/lib/batch";
import {
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  validateCustomSlug,
} from "@/lib/slug";

/**
 * Hosts and paths Google uses for "leave a review" links.
 *
 * Google changes these periodically, which is exactly why a mismatch is only a
 * warning: the admin is trusted, and a card that cannot be created is worse
 * than one pointing somewhere unexpected.
 */
const GOOGLE_REVIEW_PATTERNS: Array<(url: URL) => boolean> = [
  (url) => url.hostname === "g.page",
  (url) => url.hostname === "maps.app.goo.gl",
  (url) => url.hostname === "goo.gl" && url.pathname.startsWith("/maps"),
  (url) =>
    url.hostname === "search.google.com" &&
    url.pathname.includes("/local/writereview"),
  (url) =>
    /(^|\.)google\.[a-z.]+$/.test(url.hostname) &&
    (url.pathname.startsWith("/maps") ||
      url.searchParams.has("placeid") ||
      url.searchParams.has("place_id")),
];

/** Best-effort check. A `false` result must never block a save. */
export function looksLikeGoogleReviewUrl(input: string): boolean {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return GOOGLE_REVIEW_PATTERNS.some((matches) => matches(url));
}

/** Advisory UI check used before saving a non-Google destination. */
export function destinationNeedsAcknowledgement(input: string): boolean {
  const trimmed = input.trim();
  return (
    trimmed.length > 0 &&
    trimmed.startsWith("https://") &&
    !looksLikeGoogleReviewUrl(trimmed)
  );
}

/**
 * HTTPS is required, not merely preferred: an http:// destination would show a
 * "not secure" interstitial to a customer holding their phone at a table.
 */
export const destinationUrlSchema = z
  .string()
  .trim()
  .min(1, "Destination URL is required.")
  .superRefine((value, ctx) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a full URL, starting with https://",
      });
      return;
    }
    if (url.protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        message: "Destination must be an https:// URL.",
      });
    }
  });

/** Optional source URL retained so an admin can edit the route from the same place later. */
export const mapsUrlSchema = z
  .string()
  .trim()
  .max(2048, "Google Maps links must be 2048 characters or fewer.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null))
  .superRefine((value, ctx) => {
    if (value === null) return;

    let url: URL;
    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a full Google Maps link, starting with https://",
      });
      return;
    }

    if (url.protocol !== "https:") {
      ctx.addIssue({
        code: "custom",
        message: "Google Maps links must use https://.",
      });
    }
  });

export const businessNameSchema = z
  .string()
  .trim()
  .min(1, "Business name is required.")
  .max(120, "Business name must be 120 characters or fewer.");

export const notesSchema = z
  .string()
  .trim()
  .max(2000, "Notes must be 2000 characters or fewer.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const customSlugSchema = z
  .string()
  .trim()
  .max(SLUG_MAX_LENGTH)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .superRefine((value, ctx) => {
    if (value === undefined) return;
    const result = validateCustomSlug(value);
    if (!result.ok) {
      ctx.addIssue({ code: "custom", message: result.error });
    }
  });

export const createRouteSchema = z.object({
  business_name: businessNameSchema,
  destination_url: destinationUrlSchema,
  maps_url: mapsUrlSchema,
  notes: notesSchema,
  slug: customSlugSchema,
});

export const createBatchRouteSchema = z.object({
  business_name: businessNameSchema,
  destination_url: destinationUrlSchema,
  maps_url: mapsUrlSchema,
  notes: notesSchema,
  quantity: z.coerce
    .number()
    .int("Enter a whole number of routes.")
    .min(BATCH_MIN_SIZE, `Create at least ${BATCH_MIN_SIZE} routes.`)
    .max(BATCH_MAX_SIZE, `Create at most ${BATCH_MAX_SIZE} routes at a time.`),
});

export const updateRouteSchema = z.object({
  business_name: businessNameSchema,
  destination_url: destinationUrlSchema,
  maps_url: mapsUrlSchema,
  notes: notesSchema,
  active: z.boolean(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type CreateBatchRouteInput = z.infer<typeof createBatchRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;

export { SLUG_MIN_LENGTH, SLUG_MAX_LENGTH };

/** Flattens a Zod error into `{ fieldName: firstMessage }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
