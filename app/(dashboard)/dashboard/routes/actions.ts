"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { resolveGoogleReviewLink } from "@/lib/google-review";
import { generateSlug } from "@/lib/slug";
import {
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Belt and braces behind proxy.ts and the dashboard layout: a Server Action
  // is a public HTTP endpoint and must authenticate on its own.
  if (!user) redirect("/login");
  return user.id;
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
      return {
        errors: {},
        values,
        message: `Could not save this route: ${error.message}`,
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
    return {
      errors: {},
      values,
      message: `Could not save your changes: ${error.message}`,
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

  if (error) throw new Error(`Could not update this route: ${error.message}`);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/routes");
  revalidatePath(`/dashboard/routes/${id}`);
}
