"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { hasPermission, requireAuth } from "@/lib/permissions";
import { generateBatchKey } from "@/lib/batch";
import {
  generateStandeeKey,
  standeeSlug,
  STANDEE_MAX_SLOTS,
  STANDEE_MIN_SLOTS,
  type StandeeSlot,
} from "@/lib/standee";
import { isRoutePlatform, normalizePlatformDestination } from "@/lib/platforms";
import {
  createStandeeBatchSchema,
  createStandeeSchema,
  fieldErrors,
} from "@/lib/validation";

export type StandeeFormState = {
  errors?: Record<string, string>;
  message?: string;
  /** Echoed back so a rejected submission doesn't wipe what was typed. */
  values?: {
    business_name?: string;
    notes?: string;
    quantity?: string;
    slots?: Array<{ platform: string; destination_url: string; maps_url: string }>;
  };
};

const UNIQUE_VIOLATION = "23505";

/** How many fresh standee keys to try before giving up. */
const KEY_ATTEMPTS = 5;

/**
 * Reads the repeated `slots[i][field]` inputs the standee forms post.
 *
 * The slot count comes from the form, but is clamped here: a hand-crafted POST
 * must not be able to print a stand with one QR or with fifty.
 */
function readSlots(formData: FormData): StandeeFormState["values"] & {
  slots: Array<{ platform: string; destination_url: string; maps_url: string }>;
} {
  const requested = Number(formData.get("slot_count") ?? 0);
  const count = Math.min(
    Math.max(Number.isInteger(requested) ? requested : 0, STANDEE_MIN_SLOTS),
    STANDEE_MAX_SLOTS,
  );

  const slots = Array.from({ length: count }, (_, index) => ({
    platform: String(formData.get(`slots[${index}][platform]`) ?? "google"),
    destination_url: String(
      formData.get(`slots[${index}][destination_url]`) ?? "",
    ),
    maps_url: String(formData.get(`slots[${index}][maps_url]`) ?? ""),
  }));

  return {
    business_name: String(formData.get("business_name") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    slots,
  };
}

/** Applies the same per-platform normalisation single routes get. */
function normalizeSlots(
  slots: Array<{ platform: string; destination_url: string; maps_url: string }>,
) {
  return slots.map((slot) => {
    const platform = isRoutePlatform(slot.platform) ? slot.platform : "google";
    return {
      ...slot,
      platform,
      destination_url: normalizePlatformDestination(
        platform,
        slot.destination_url,
      ),
    };
  });
}

type StandeeRow = {
  owner_id: string;
  slug: string;
  standee_key: string;
  standee_position: number;
  batch_key: string | null;
  batch_position: number | null;
  business_name: string;
  platform: StandeeSlot["platform"];
  destination_url: string;
  maps_url: string | null;
  notes: string | null;
  publication_status: "draft" | "published";
  active: boolean;
};

/**
 * Creates one physical stand: two to four routes that share a business name,
 * a key and a print run, each with its own permanent slug and QR code.
 */
export async function createStandee(
  _prevState: StandeeFormState,
  formData: FormData,
): Promise<StandeeFormState> {
  const access = await requireAuth();
  if (!hasPermission(access, "routes", "manage")) notFound();

  const values = readSlots(formData);
  values.slots = normalizeSlots(values.slots);

  const parsed = createStandeeSchema.safeParse({
    business_name: values.business_name,
    notes: values.notes,
    slots: values.slots,
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const { userId: ownerId, profile } = access;
  const supabase = await createClient();
  const publicationStatus: "draft" | "published" =
    profile.role === "superadmin" ? "published" : "draft";

  let standeeKey: string | null = null;

  // A multi-row insert is transactional at the PostgREST boundary: either the
  // whole stand exists or none of it does. Half a standee -- one live QR and
  // one dead one -- would be worse than a failed submission.
  for (let attempt = 0; attempt < KEY_ATTEMPTS; attempt++) {
    const candidate = generateStandeeKey();
    const rows: StandeeRow[] = parsed.data.slots.map((slot, index) => ({
      owner_id: ownerId,
      slug: standeeSlug(candidate, index + 1),
      standee_key: candidate,
      standee_position: index + 1,
      batch_key: null,
      batch_position: null,
      business_name: parsed.data.business_name,
      platform: slot.platform,
      destination_url: slot.destination_url,
      maps_url: slot.maps_url,
      notes: parsed.data.notes,
      publication_status: publicationStatus,
      active: profile.role === "superadmin",
    }));

    const { error } = await supabase.from("redirect_routes").insert(rows);

    if (!error) {
      standeeKey = candidate;
      break;
    }

    if (error.code !== UNIQUE_VIOLATION) {
      console.error("[standees] create_failed", { code: error.code });
      return {
        errors: {},
        values,
        message: "Could not save this standee. Please try again.",
      };
    }
  }

  if (!standeeKey) {
    return {
      errors: {},
      values,
      message: "Could not generate a unique standee link. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/standees");
  redirect(`/dashboard/standees/${standeeKey}?created=1`);
}

/**
 * Creates many identical stands in one print run. Every stand gets its own key
 * and QR codes; the run shares one `batch_key` so the whole order downloads as
 * a single ZIP.
 */
export async function createStandeeBatch(
  _prevState: StandeeFormState,
  formData: FormData,
): Promise<StandeeFormState> {
  const access = await requireAuth();
  if (!hasPermission(access, "routes", "manage")) notFound();

  const values = readSlots(formData);
  values.slots = normalizeSlots(values.slots);

  const parsed = createStandeeBatchSchema.safeParse({
    business_name: values.business_name,
    notes: values.notes,
    slots: values.slots,
    quantity: values.quantity,
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const { userId: ownerId, profile } = access;
  const supabase = await createClient();
  const publicationStatus: "draft" | "published" =
    profile.role === "superadmin" ? "published" : "draft";

  let batchKey: string | null = null;

  for (let attempt = 0; attempt < KEY_ATTEMPTS; attempt++) {
    const candidateBatch = generateBatchKey();
    const rows: StandeeRow[] = [];

    for (let stand = 0; stand < parsed.data.quantity; stand++) {
      const candidateStandee = generateStandeeKey();
      parsed.data.slots.forEach((slot, index) => {
        rows.push({
          owner_id: ownerId,
          slug: standeeSlug(candidateStandee, index + 1),
          standee_key: candidateStandee,
          standee_position: index + 1,
          batch_key: candidateBatch,
          // Sequential across the run, because `(batch_key, batch_position)`
          // is unique. The stand a QR belongs to is `standee_key`, not this.
          batch_position: rows.length + 1,
          business_name: parsed.data.business_name,
          platform: slot.platform,
          destination_url: slot.destination_url,
          maps_url: slot.maps_url,
          notes: parsed.data.notes,
          publication_status: publicationStatus,
          active: profile.role === "superadmin",
        });
      });
    }

    const { error } = await supabase.from("redirect_routes").insert(rows);

    if (!error) {
      batchKey = candidateBatch;
      break;
    }

    if (error.code !== UNIQUE_VIOLATION) {
      console.error("[standees] batch_create_failed", { code: error.code });
      return {
        errors: {},
        values,
        message: "Could not save this standee run. Please try again.",
      };
    }
  }

  if (!batchKey) {
    return {
      errors: {},
      values,
      message: "Could not generate unique standee links. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath("/dashboard/standees");
  redirect(`/dashboard/standees/runs/${batchKey}?created=1`);
}
