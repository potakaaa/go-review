"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  hasPermission,
  isSuperadmin,
  requireAuth,
  requirePermission,
} from "@/lib/permissions";
import { batchSlug, generateBatchKey } from "@/lib/batch";
import {
  incrementedRouteNames,
  sortRoutesByBusinessName,
} from "@/lib/batch-edit";
import { resolveFacebookReviewLink } from "@/lib/facebook-review";
import { resolveGoogleReviewLink } from "@/lib/google-review";
import { generateSlug } from "@/lib/slug";
import { isRoutePlatform, normalizePlatformDestination } from "@/lib/platforms";
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

/** Shared by both link converters: the same field, button and result panel. */
export type ReviewLinkConversionState = {
  reviewUrl?: string;
  sourceUrl?: string;
  message?: string;
};

export type GoogleReviewConversionState = ReviewLinkConversionState;

/**
 * Outcome of a one-tap route change. Returned rather than thrown, so the
 * button can roll back its optimistic state and say what went wrong in a
 * toast instead of replacing the page with the error screen.
 */
export type RouteChangeResult = { ok: true } | { ok: false; message: string };

/** Postgres insufficient-privilege, raised by the publication trigger. */
const INSUFFICIENT_PRIVILEGE = "42501";

/** Postgres unique-violation. */
const UNIQUE_VIOLATION = "23505";

/** How many fresh slugs to try before giving up. */
const SLUG_ATTEMPTS = 5;

/**
 * Resolves a Google Maps share link without creating or changing a route.
 * Authentication is checked here because Server Actions are public POST
 * endpoints even when their form only appears on an authenticated page.
 */
export async function convertGoogleMapsLink(
  _prevState: GoogleReviewConversionState,
  formData: FormData,
): Promise<GoogleReviewConversionState> {
  const access = await requireAuth();
  if (!hasPermission(access, "convert", "view")) notFound();

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

/**
 * Turns a Facebook Page link into the URL for that Page's Reviews tab.
 *
 * Desktop Page URLs are converted without leaving the server; the opaque
 * `/share/…` links the mobile apps hand out are followed first. Same public
 * POST surface as the Maps converter, so the same auth check applies.
 */
export async function convertFacebookPageLink(
  _prevState: ReviewLinkConversionState,
  formData: FormData,
): Promise<ReviewLinkConversionState> {
  const access = await requireAuth();
  if (!hasPermission(access, "convert", "view")) notFound();

  const rawValue = formData.get("facebook_url");
  const sourceUrl = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!sourceUrl) {
    return {
      sourceUrl,
      message: "Paste a Facebook Page or share link first.",
    };
  }

  if (sourceUrl.length > 2048) {
    return {
      sourceUrl,
      message: "That link is too long. Paste the Facebook Page link again.",
    };
  }

  const result = await resolveFacebookReviewLink(sourceUrl);
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
  const access = await requireAuth();
  if (!hasPermission(access, "routes", "manage")) notFound();

  const values = {
    platform: String(formData.get("platform") ?? "google"),
    business_name: String(formData.get("business_name") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    slug: String(formData.get("slug") ?? ""),
  };

  const platform = isRoutePlatform(values.platform) ? values.platform : "google";
  values.destination_url = normalizePlatformDestination(platform, values.destination_url);
  const parsed = createRouteSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const { userId: ownerId, profile } = access;
  const supabase = await createClient();
  const publicationStatus: "draft" | "published" =
    profile.role === "superadmin" ? "published" : "draft";
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
        platform: parsed.data.platform,
        destination_url: parsed.data.destination_url,
        maps_url: parsed.data.maps_url,
        notes: parsed.data.notes,
        publication_status: publicationStatus,
        active: profile.role === "superadmin",
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
  const access = await requireAuth();
  if (!hasPermission(access, "routes", "manage")) notFound();

  const values = {
    platform: String(formData.get("platform") ?? "google"),
    business_name: String(formData.get("business_name") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
  };

  const platform = isRoutePlatform(values.platform) ? values.platform : "google";
  values.destination_url = normalizePlatformDestination(platform, values.destination_url);
  const parsed = createBatchRouteSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const { userId: ownerId, profile } = access;
  const supabase = await createClient();
  const publicationStatus: "draft" | "published" =
    profile.role === "superadmin" ? "published" : "draft";

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
      platform: parsed.data.platform,
      destination_url: parsed.data.destination_url,
      maps_url: parsed.data.maps_url,
      notes: parsed.data.notes,
      publication_status: publicationStatus,
      active: profile.role === "superadmin",
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
  const access = await requirePermission("routes", "manage");
  const values = {
    platform: String(formData.get("platform") ?? "google"),
    name_seed: String(formData.get("name_seed") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
  };
  const routeIds = formData
    .getAll("route_ids")
    .filter((value): value is string => typeof value === "string");

  const platform = isRoutePlatform(values.platform) ? values.platform : "google";
  values.destination_url = normalizePlatformDestination(platform, values.destination_url);
  const parsed = batchEditRouteSchema.safeParse({
    ...values,
    route_ids: routeIds,
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const { supabase } = access;

  // The client sends only ids and the requested changes. Read the current
  // names again here so the assignment order and lock decision are server
  // authoritative even if the page has been left open for a while.
  const { data: selectedRows, error: selectedRowsError } = await supabase
    .from("redirect_routes")
    .select("id, business_name, locked, platform")
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

  if (selectedRoutes.some((route) => route.platform !== parsed.data.platform)) {
    return {
      errors: { route_ids: "Select routes from the same platform." },
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
      p_platform: parsed.data.platform,
      p_destination_url: parsed.data.destination_url,
      p_maps_url: parsed.data.maps_url,
    },
  );

  if (updateError) {
    if (updateError.code === "23514") {
      return {
        errors: {
          destination_url:
            "Use an approved destination for the selected platform.",
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
  const access = await requireAuth();
  if (!hasPermission(access, "routes", "manage")) notFound();

  const id = String(formData.get("id") ?? "");
  if (!id) return { errors: {}, message: "Missing route id." };

  const values = {
    platform: String(formData.get("platform") ?? "google"),
    business_name: String(formData.get("business_name") ?? ""),
    destination_url: String(formData.get("destination_url") ?? ""),
    maps_url: String(formData.get("maps_url") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    confirm_business_name: String(formData.get("confirm_business_name") ?? ""),
  };

  const platform = isRoutePlatform(values.platform) ? values.platform : "google";
  values.destination_url = normalizePlatformDestination(platform, values.destination_url);
  const parsed = updateRouteSchema.safeParse({
    ...values,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const supabase = await createClient();

  // The lock check happens on the server against the stored business name.
  // The submitted business name is intentionally not used for confirmation:
  // otherwise a user could rename a locked route and confirm against the new
  // value in the same request.
  const { data: currentRoute, error: currentRouteError } = await supabase
    .from("redirect_routes")
    .select("business_name, locked, platform, publication_status")
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

  if (
    currentRoute.publication_status === "published" &&
    parsed.data.platform !== currentRoute.platform
  ) {
    return {
      errors: { platform: "The platform is fixed after a route is published." },
      values,
    };
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
  // `select` is what makes a refused write visible. The section permission
  // above says this admin may edit routes in general; the per-route grant is
  // enforced by RLS, and an UPDATE that matches no row is not an error in
  // PostgREST -- without the returned row this action would redirect to
  // `?saved=1` having changed nothing.
  const { data: updated, error } = await supabase
    .from("redirect_routes")
    .update({
      business_name: parsed.data.business_name,
      platform: parsed.data.platform,
      destination_url: parsed.data.destination_url,
      maps_url: parsed.data.maps_url,
      notes: parsed.data.notes,
      active: parsed.data.active,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[routes] update_failed", { code: error.code });
    return {
      errors: {},
      values,
      message: "Could not save your changes. Please try again.",
    };
  }

  if (!updated || updated.length === 0) {
    return {
      errors: {},
      values,
      message:
        "You have view-only access to this route, so nothing was changed. Ask a superadmin for manage access.",
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
export async function toggleRouteActive(
  formData: FormData,
): Promise<RouteChangeResult> {
  const access = await requireAuth();
  if (!hasPermission(access, "routes", "manage")) notFound();

  const id = String(formData.get("id") ?? "");
  const nextActive = formData.get("next_active") === "true";
  if (!id) return { ok: false, message: "Missing route id." };

  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("redirect_routes")
    .update({ active: nextActive })
    .eq("id", id)
    .select("id, active");

  if (error) {
    console.error("[routes] status_update_failed", { code: error.code });
    return {
      ok: false,
      message:
        error.code === INSUFFICIENT_PRIVILEGE
          ? "A superadmin has to approve this draft before it can go live."
          : "Could not update this route. Check your connection and try again.",
    };
  }

  // RLS refuses the row rather than the statement, so no rows back means
  // view-only access to this route.
  if (!updated || updated.length === 0) {
    return { ok: false, message: "You have view-only access to this route." };
  }

  // The publication trigger keeps a draft switched off even for a superadmin,
  // silently. Report what was stored, not what was asked for.
  if (updated[0].active !== nextActive) {
    return {
      ok: false,
      message: "Drafts stay off until they are published. Publish this route first.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath(`/dashboard/routes/${id}`);
  return { ok: true };
}

/**
 * Locks or unlocks editing for one route. This intentionally does not affect
 * the public redirect or the active/inactive switch: a business can protect
 * its destination details while still pausing the printed card if needed.
 */
export async function toggleRouteLocked(
  formData: FormData,
): Promise<RouteChangeResult> {
  const access = await requireAuth();
  if (!hasPermission(access, "routes", "manage")) notFound();

  const id = String(formData.get("id") ?? "");
  const nextLocked = formData.get("next_locked") === "true";
  if (!id) return { ok: false, message: "Missing route id." };

  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("redirect_routes")
    .update({ locked: nextLocked })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[routes] lock_update_failed", { code: error.code });
    return {
      ok: false,
      message: "Could not update this route. Check your connection and try again.",
    };
  }

  if (!updated || updated.length === 0) {
    return { ok: false, message: "You have view-only access to this route." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath(`/dashboard/routes/${id}`);
  revalidatePath(`/dashboard/routes/${id}/edit`);
  return { ok: true };
}

/** Only a superadmin can make a regular admin's draft public. */
export async function publishRoute(
  formData: FormData,
): Promise<RouteChangeResult> {
  const access = await requireAuth();
  if (!isSuperadmin(access)) notFound();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing route id." };

  const { supabase } = access;
  const { data: published, error } = await supabase
    .from("redirect_routes")
    .update({ publication_status: "published", active: true })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[routes] publish_failed", { code: error.code });
    return { ok: false, message: "Could not publish this route. Try again." };
  }

  if (!published || published.length === 0) {
    return { ok: false, message: "Could not publish this route. Try again." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath(`/dashboard/routes/${id}`);
  return { ok: true };
}
