"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireStaffMfa } from "@/lib/auth";
import { batchSlug, generateBatchKey } from "@/lib/batch";
import {
  incrementedRouteNames,
  sortRoutesByBusinessName,
} from "@/lib/batch-edit";
import { resolveGoogleReviewLink } from "@/lib/google-review";
import { generateSlug } from "@/lib/slug";
import {
  batchEditRouteSchema,
  businessNameSchema,
  createBatchRouteSchema,
  createRouteSchema,
  fieldErrors,
  updateRouteSchema,
} from "@/lib/validation";

export type RouteFormState = {
  errors?: Record<string, string>;
  message?: string;
  /** Echoed back so a rejected submission doesn't wipe what was typed. */
  values?: Record<string, string>;
};

export type GoogleReviewConversionState = {
  reviewUrl?: string;
  sourceUrl?: string;
  message?: string;
};

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

/** How many fresh slugs to try before giving up. */
const SLUG_ATTEMPTS = 5;

async function requireUserId(): Promise<string> {
  const { userId } = await requireStaffMfa();
  return userId;
}

/**
 * Resolves a Google Maps share link without creating or changing a route.
 * Authentication is checked here because Server Actions are public POST
 * endpoints even when their form only appears on an authenticated page.
 */
export async function convertGoogleMapsLink(
  _prevState: GoogleReviewConversionState,
  formData: FormData,
): Promise<GoogleReviewConversionState> {
  await requireUserId();

  const rawValue = formData.get("maps_url");
  const sourceUrl = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!sourceUrl) {
    return {
      sourceUrl,
      message: "Paste a Google Maps share link first.",
    };
  }

  if (sourceUrl.length > 2048) {
    return {
      sourceUrl,
      message: "That link is too long. Paste the Google Maps share link again.",
    };
  }

  const result = await resolveGoogleReviewLink(sourceUrl);
  if (!result.ok) return { sourceUrl, message: result.message };

  return {
    sourceUrl,
    reviewUrl: result.reviewUrl,
  };
}

export async function createRoute(
  _prevState: RouteFormState,
  formData: FormData,
): Promise<RouteFormState> {
  const values = {
    business_name: String(formData.get("business_name") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  };

  const parsed = createRouteSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const ownerId = await requireUserId();
  const supabase = await createClient();
  const customSlug = parsed.data.slug;

  let newId: string | null = null;

  // Uniqueness is settled by the database's unique index, not by a prior
  // SELECT: checking first leaves a window where two submissions can both see
  // a slug as free and one loses at insert time with an unhelpful error.
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const slug = customSlug ?? generateSlug();

    const { data, error } = await supabase
      .from("redirect_routes")
      .insert({
        owner_id: ownerId,
        slug,
        business_name: parsed.data.business_name,
        destination_url: parsed.data.destination_url,
        maps_url: parsed.data.maps_url,
        notes: parsed.data.notes,
      })
      .select("id")
      .single();

    if (!error) {
      newId = data.id;
      break;
    }

    if (error.code !== UNIQUE_VIOLATION) {
      console.error("[routes] create_failed", { code: error.code });
      return {
        errors: {},
        values,
        message: "Could not save this route. Please try again.",
      };
    }

    // A collision on a slug the admin chose is a real answer, not bad luck --
    // retrying with a different one would silently ignore what they asked for.
    if (customSlug) {
      return {
        errors: { slug: "That slug is already taken. Try another." },
        values,
      };
    }
  }

  if (!newId) {
    return {
      errors: {},
      values,
      message: "Could not generate a unique link. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  redirect(`/dashboard/routes/${newId}?created=1`);
}

/**
 * Creates one atomic print run. Every route shares the same destination and
 * gets a readable, numbered slug such as `akfiuex-1` through `akfiuex-30`.
 */
export async function createBatch(
  _prevState: RouteFormState,
  formData: FormData,
): Promise<RouteFormState> {
  const values = {
    business_name: String(formData.get("business_name") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
  };

  const parsed = createBatchRouteSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const ownerId = await requireUserId();
  const supabase = await createClient();

  let batchKey: string | null = null;

  // A batch insert is transactional at the PostgREST boundary: either every
  // numbered card is created, or none is. A fresh random prefix handles the
  // extremely unlikely case where a slug already exists.
  for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt++) {
    const candidate = generateBatchKey();
    const rows = Array.from({ length: parsed.data.quantity }, (_, index) => ({
      owner_id: ownerId,
      slug: batchSlug(candidate, index + 1),
      batch_key: candidate,
      batch_position: index + 1,
      business_name: parsed.data.business_name,
      destination_url: parsed.data.destination_url,
      maps_url: parsed.data.maps_url,
      notes: parsed.data.notes,
    }));

    const { error } = await supabase.from("redirect_routes").insert(rows);

    if (!error) {
      batchKey = candidate;
      break;
    }

    if (error.code !== UNIQUE_VIOLATION) {
      console.error("[routes] batch_create_failed", { code: error.code });
      return {
        errors: {},
        values,
        message: "Could not save this batch. Please try again.",
      };
    }
  }

  if (!batchKey) {
    return {
      errors: {},
      values,
      message: "Could not generate a unique batch link. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  redirect(`/dashboard/routes/batches/${batchKey}?created=1`);
}

/**
 * Updates selected routes as one atomic database operation. Names are assigned
 * in the same alphabetical order shown on the batch-edit screen, while each
 * physical route slug remains unchanged.
 */
export async function batchUpdateRoutes(
  _prevState: RouteFormState,
  formData: FormData,
): Promise<RouteFormState> {
  const values = {
    name_seed: String(formData.get("name_seed") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
  };
  const routeIds = formData
    .getAll("route_ids")
    .filter((value): value is string => typeof value === "string");

  const parsed = batchEditRouteSchema.safeParse({
    ...values,
    route_ids: routeIds,
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  await requireUserId();
  const supabase = await createClient();

  // The client sends only ids and the requested changes. Read the current
  // names again here so the assignment order and lock decision are server
  // authoritative even if the page has been left open for a while.
  const { data: selectedRows, error: selectedRowsError } = await supabase
    .from("redirect_routes")
    .select("id, business_name, locked")
    .in("id", parsed.data.route_ids);

  if (selectedRowsError) {
    console.error("[routes] batch_edit_check_failed", {
      code: selectedRowsError.code,
    });
    return {
      errors: {},
      values,
      message: "Could not verify the selected routes. Please try again.",
    };
  }

  const selectedRoutes = sortRoutesByBusinessName(selectedRows ?? []);
  if (selectedRoutes.length !== parsed.data.route_ids.length) {
    return {
      errors: {
        route_ids:
          "One or more selected routes are no longer available. Refresh and try again.",
      },
      values,
    };
  }

  if (selectedRoutes.some((route) => route.locked)) {
    return {
      errors: {
        route_ids:
          "Unlock the selected locked routes before batch editing them.",
      },
      values,
    };
  }

  const businessNames = incrementedRouteNames(
    parsed.data.name_seed,
    selectedRoutes.length,
  );
  if (
    businessNames.some(
      (businessName) => !businessNameSchema.safeParse(businessName).success,
    )
  ) {
    return {
      errors: {
        name_seed: "The generated names must each be 120 characters or fewer.",
      },
      values,
    };
  }

  const { data: updatedCount, error: updateError } = await supabase.rpc(
    "batch_update_routes",
    {
      p_route_ids: selectedRoutes.map((route) => route.id),
      p_business_names: businessNames,
      p_destination_url: parsed.data.destination_url,
      p_maps_url: parsed.data.maps_url,
    },
  );

  if (updateError) {
    if (updateError.code === "23514") {
      return {
        errors: {
          destination_url:
            "Use an approved Google Maps or Google Review URL.",
        },
        values,
      };
    }

    if (updateError.code === "55000") {
      return {
        errors: {
          route_ids:
            "A selected route is now locked. Refresh and try again.",
        },
        values,
      };
    }

    console.error("[routes] batch_edit_failed", { code: updateError.code });
    return {
      errors: {},
      values,
      message: "Could not update these routes. Please refresh and try again.",
    };
  }

  if (updatedCount !== selectedRoutes.length) {
    console.error("[routes] batch_edit_count_mismatch", {
      expected: selectedRoutes.length,
      received: updatedCount,
    });
    return {
      errors: {},
      values,
      message: "The selected routes were not all updated. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  redirect(`/dashboard/routes?updated=${updatedCount}`);
}

export async function updateRoute(
  _prevState: RouteFormState,
  formData: FormData,
): Promise<RouteFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { errors: {}, message: "Missing route id." };

  const values = {
    business_name: String(formData.get("business_name") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    confirm_business_name: String(formData.get("confirm_business_name") ?? ""),
  };

  const parsed = updateRouteSchema.safeParse({
    ...values,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  await requireUserId();
  const supabase = await createClient();

  // The lock check happens on the server against the stored business name.
  // The submitted business name is intentionally not used for confirmation:
  // otherwise a user could rename a locked route and confirm against the new
  // value in the same request.
  const { data: currentRoute, error: currentRouteError } = await supabase
    .from("redirect_routes")
    .select("business_name, locked")
    .eq("id", id)
    .maybeSingle();

  if (currentRouteError) {
    console.error("[routes] edit_check_failed", {
      code: currentRouteError.code,
    });
    return {
      errors: {},
      values,
      message: "Could not verify this route. Please try again.",
    };
  }

  if (!currentRoute) {
    return { errors: {}, values, message: "Could not find this route." };
  }

  const submittedConfirmation = values.confirm_business_name.trim().toLowerCase();
  const storedBusinessName = currentRoute.business_name.trim().toLowerCase();

  if (currentRoute.locked && submittedConfirmation !== storedBusinessName) {
    return {
      errors: {
        confirm_business_name:
          "Type the current business name to edit this locked route.",
      },
      values,
    };
  }

  // `slug` is deliberately absent from this update. A card in a customer's
  // hands is printed once; changing where it points must never change the URL
  // printed on it. The form renders the slug read-only for the same reason.
  const { error } = await supabase
    .from("redirect_routes")
    .update({
      business_name: parsed.data.business_name,
      destination_url: parsed.data.destination_url,
      maps_url: parsed.data.maps_url,
      notes: parsed.data.notes,
      active: parsed.data.active,
    })
    .eq("id", id);

  if (error) {
    console.error("[routes] update_failed", { code: error.code });
    return {
      errors: {},
      values,
      message: "Could not save your changes. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath(`/dashboard/routes/${id}`);
  redirect(`/dashboard/routes/${id}?saved=1`);
}

/**
 * Soft on/off switch. Routes are never deleted -- a card already handed to a
 * cafe must always resolve to *something*, even if that something is the
 * branded "deactivated" page.
 */
export async function toggleRouteActive(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const nextActive = formData.get("next_active") === "true";
  if (!id) return;

  await requireUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("redirect_routes")
    .update({ active: nextActive })
    .eq("id", id);

  if (error) {
    console.error("[routes] status_update_failed", { code: error.code });
    throw new Error("Could not update this route.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath(`/dashboard/routes/${id}`);
}

/**
 * Locks or unlocks editing for one route. This intentionally does not affect
 * the public redirect or the active/inactive switch: a business can protect
 * its destination details while still pausing the printed card if needed.
 */
export async function toggleRouteLocked(formData: FormData): Promise<void> {
  // Authenticate before even accepting the no-op path: exported Server
  // Actions can be invoked directly without rendering this page first.
  await requireUserId();

  const id = String(formData.get("id") ?? "");
  const nextLocked = formData.get("next_locked") === "true";
  if (!id) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("redirect_routes")
    .update({ locked: nextLocked })
    .eq("id", id);

  if (error) {
    console.error("[routes] lock_update_failed", { code: error.code });
    throw new Error("Could not update this route.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath(`/dashboard/routes/${id}`);
  revalidatePath(`/dashboard/routes/${id}/edit`);
}
