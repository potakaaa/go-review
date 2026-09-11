import { z } from "zod";

import {
  destinationNeedsAcknowledgement,
  looksLikeGoogleReviewUrl,
} from "@/lib/validation-client";

import { BATCH_MAX_SIZE, BATCH_MIN_SIZE } from "@/lib/batch";
import { BATCH_EDIT_MAX_SIZE } from "@/lib/batch-edit";
import {
  SLUG_MAX_LENGTH,
  SLUG_MIN_LENGTH,
  validateCustomSlug,
} from "@/lib/slug";

export { destinationNeedsAcknowledgement, looksLikeGoogleReviewUrl };

/**
 * Destinations are intentionally limited to Google's review/Maps surfaces. A
 * compromised staff session therefore cannot repoint printed client cards to
 * an arbitrary phishing origin.
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
      return;
    }
    if (!looksLikeGoogleReviewUrl(value)) {
      ctx.addIssue({
        code: "custom",
        message: "Use an approved Google Maps or Google Review URL.",
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

/** Mirrors the production Supabase Auth password policy. */
export const passwordSchema = z
  .string()
  .min(14, "Use at least 14 characters.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a symbol.");

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

export const batchEditRouteSchema = z.object({
  route_ids: z
    .array(z.uuid("Select valid routes."))
    .min(1, "Select at least one route.")
    .max(
      BATCH_EDIT_MAX_SIZE,
      `Select ${BATCH_EDIT_MAX_SIZE} routes or fewer at a time.`,
    )
    .superRefine((ids, ctx) => {
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: "custom",
          message: "Each route can only be selected once.",
        });
      }
  }),
  name_seed: businessNameSchema,
  destination_url: destinationUrlSchema,
  maps_url: mapsUrlSchema,
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
export type BatchEditRouteInput = z.infer<typeof batchEditRouteSchema>;
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
