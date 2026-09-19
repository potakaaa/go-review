import { z } from "zod";

import {
  destinationNeedsAcknowledgement,
  looksLikeGoogleReviewUrl,
  looksLikePlatformDestination,
} from "@/lib/validation-client";
import { ROUTE_PLATFORMS, type RoutePlatform } from "@/lib/platforms";

import { BATCH_MAX_SIZE, BATCH_MIN_SIZE } from "@/lib/batch";
import {
  duplicateDestinationIndex,
  maxStandeeBatchSize,
  STANDEE_BATCH_MIN_SIZE,
  STANDEE_MAX_SLOTS,
  STANDEE_MIN_SLOTS,
} from "@/lib/standee";
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
const httpsDestinationSchema = z
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
  });

/** Backwards-compatible Google-only schema used by the converter and tests. */
export const destinationUrlSchema = httpsDestinationSchema.superRefine((value, ctx) => {
  if (!looksLikeGoogleReviewUrl(value)) {
    ctx.addIssue({ code: "custom", message: "Use an approved Google Maps or Google Review URL." });
  }
});

export const platformSchema = z.enum(ROUTE_PLATFORMS).default("google");

function addPlatformDestinationIssues(
  value: { platform: RoutePlatform; destination_url: string; maps_url?: string | null },
  ctx: z.RefinementCtx,
) {
  if (!looksLikePlatformDestination(value.platform, value.destination_url)) {
    ctx.addIssue({
      code: "custom",
      path: ["destination_url"],
      message:
        value.platform === "google"
          ? "Use an approved Google Maps or Google Review URL."
          : value.platform === "facebook"
            ? "Use a valid Facebook Page, Reviews, or Recommendations URL."
            : "Use a valid Instagram profile URL.",
    });
  }
  if (value.platform !== "google" && value.maps_url) {
    ctx.addIssue({
      code: "custom",
      path: ["maps_url"],
      message: "Google Maps source links are only used for Google routes.",
    });
  }
}

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
  platform: platformSchema,
  business_name: businessNameSchema,
  destination_url: httpsDestinationSchema,
  maps_url: mapsUrlSchema,
  notes: notesSchema,
  slug: customSlugSchema,
}).superRefine(addPlatformDestinationIssues);

export const createBatchRouteSchema = z.object({
  platform: platformSchema,
  business_name: businessNameSchema,
  destination_url: httpsDestinationSchema,
  maps_url: mapsUrlSchema,
  notes: notesSchema,
  quantity: z.coerce
    .number()
    .int("Enter a whole number of routes.")
    .min(BATCH_MIN_SIZE, `Create at least ${BATCH_MIN_SIZE} routes.`)
    .max(BATCH_MAX_SIZE, `Create at most ${BATCH_MAX_SIZE} routes at a time.`),
}).superRefine(addPlatformDestinationIssues);

export const batchEditRouteSchema = z.object({
  platform: platformSchema,
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
  destination_url: httpsDestinationSchema,
  maps_url: mapsUrlSchema,
}).superRefine(addPlatformDestinationIssues);

/**
 * One QR slot on a standee. The stand shares a business name and notes, so a
 * slot only carries where its own QR points.
 */
export const standeeSlotSchema = z.object({
  platform: platformSchema,
  destination_url: httpsDestinationSchema,
  maps_url: mapsUrlSchema,
});

/**
 * Slot errors are keyed `slots.0.destination_url` so `fieldErrors` can hand
 * each message back to the row of the form that produced it.
 */
function addStandeeSlotIssues(
  value: { slots: Array<{ platform: RoutePlatform; destination_url: string; maps_url?: string | null }> },
  ctx: z.RefinementCtx,
) {
  value.slots.forEach((slot, index) => {
    if (!looksLikePlatformDestination(slot.platform, slot.destination_url)) {
      ctx.addIssue({
        code: "custom",
        path: [`slots.${index}.destination_url`],
        message:
          slot.platform === "google"
            ? "Use an approved Google Maps or Google Review URL."
            : slot.platform === "facebook"
              ? "Use a valid Facebook Page, Reviews, or Recommendations URL."
              : "Use a valid Instagram profile URL.",
      });
    }
    if (slot.platform !== "google" && slot.maps_url) {
      ctx.addIssue({
        code: "custom",
        path: [`slots.${index}.maps_url`],
        message: "Google Maps source links are only used for Google routes.",
      });
    }
  });

  const duplicate = duplicateDestinationIndex(
    value.slots.map((slot) => slot.destination_url),
  );
  if (duplicate !== -1) {
    ctx.addIssue({
      code: "custom",
      path: [`slots.${duplicate}.destination_url`],
      message: "Each QR on a standee needs its own destination.",
    });
  }
}

export const createStandeeSchema = z
  .object({
    business_name: businessNameSchema,
    notes: notesSchema,
    slots: z
      .array(standeeSlotSchema)
      .min(STANDEE_MIN_SLOTS, `A standee needs at least ${STANDEE_MIN_SLOTS} QR codes.`)
      .max(STANDEE_MAX_SLOTS, `A standee holds at most ${STANDEE_MAX_SLOTS} QR codes.`),
  })
  .superRefine(addStandeeSlotIssues);

export const createStandeeBatchSchema = createStandeeSchema
  .safeExtend({
    quantity: z.coerce
      .number()
      .int("Enter a whole number of standees.")
      .min(
        STANDEE_BATCH_MIN_SIZE,
        `Create at least ${STANDEE_BATCH_MIN_SIZE} standees.`,
      ),
  })
  .superRefine((value, ctx) => {
    const limit = maxStandeeBatchSize(value.slots.length);
    if (value.quantity > limit) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: `With ${value.slots.length} QR codes per standee, create at most ${limit} standees at a time.`,
      });
    }
  });

export const updateRouteSchema = z.object({
  platform: platformSchema,
  business_name: businessNameSchema,
  destination_url: httpsDestinationSchema,
  maps_url: mapsUrlSchema,
  notes: notesSchema,
  active: z.boolean(),
}).superRefine(addPlatformDestinationIssues);

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type CreateBatchRouteInput = z.infer<typeof createBatchRouteSchema>;
export type BatchEditRouteInput = z.infer<typeof batchEditRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type CreateStandeeInput = z.infer<typeof createStandeeSchema>;
export type CreateStandeeBatchInput = z.infer<typeof createStandeeBatchSchema>;

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
