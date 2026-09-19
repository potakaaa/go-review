import "server-only";

import { requirePermission } from "@/lib/permissions";
import type { RedirectRoute } from "@/lib/database.types";
import { normalizeRoutePlatform } from "@/lib/platforms";
import { groupRoutesByStandee, STANDEE_KEY_PATTERN } from "@/lib/standee";

export type Standee = {
  standeeKey: string;
  businessName: string;
  batchKey: string | null;
  createdAt: string;
  /** Ordered by `standee_position` -- slot 1 is the leftmost QR on the stand. */
  routes: RedirectRoute[];
};

/**
 * The standee columns are additive. During a rolling deploy an older database
 * can still answer every other query, so a missing column becomes an honest
 * empty list rather than a crashed dashboard.
 */
function isMissingStandeeColumn(error: { code?: string } | null): boolean {
  return error?.code === "PGRST204" || error?.code === "42703";
}

function normalizeRouteRow(route: RedirectRoute): RedirectRoute {
  return { ...route, platform: normalizeRoutePlatform(route.platform) };
}

function toStandee(standeeKey: string, routes: RedirectRoute[]): Standee {
  const first = routes[0];
  return {
    standeeKey,
    businessName: first.business_name,
    batchKey: first.batch_key,
    createdAt: first.created_at,
    routes,
  };
}

/** Every stand the signed-in staff member can see, newest first. */
export async function listStandees(): Promise<Standee[]> {
  const { supabase } = await requirePermission("routes", "view");

  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .not("standee_key", "is", null)
    // Stands created in one run share a timestamp to the microsecond, so the
    // key is the tiebreaker that keeps each stand's QRs adjacent.
    .order("created_at", { ascending: false })
    .order("standee_key", { ascending: true })
    .order("standee_position", { ascending: true });

  if (error) {
    if (isMissingStandeeColumn(error)) return [];
    console.error("[standees] list_failed", { code: error.code });
    throw new Error("Could not load standees.");
  }

  return groupRoutesByStandee((data ?? []).map(normalizeRouteRow)).map(
    (group) => toStandee(group.standeeKey, group.routes),
  );
}

export async function getStandee(standeeKey: string): Promise<Standee | null> {
  if (!STANDEE_KEY_PATTERN.test(standeeKey)) return null;

  const { supabase } = await requirePermission("routes", "view");

  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .eq("standee_key", standeeKey)
    .order("standee_position", { ascending: true });

  if (error) {
    if (isMissingStandeeColumn(error)) return null;
    console.error("[standees] detail_failed", { code: error.code });
    throw new Error("Could not load this standee.");
  }

  const routes = (data ?? []).map(normalizeRouteRow);
  return routes.length > 0 ? toStandee(standeeKey, routes) : null;
}

/** Every stand printed in one run, in the order the run created them. */
export async function getStandeeRun(batchKey: string): Promise<Standee[]> {
  const { supabase } = await requirePermission("routes", "view");

  const { data, error } = await supabase
    .from("redirect_routes")
    .select("*")
    .eq("batch_key", batchKey)
    .not("standee_key", "is", null)
    .order("batch_position", { ascending: true });

  if (error) {
    if (isMissingStandeeColumn(error)) return [];
    console.error("[standees] run_failed", { code: error.code });
    throw new Error("Could not load this standee run.");
  }

  return groupRoutesByStandee((data ?? []).map(normalizeRouteRow)).map(
    (group) => toStandee(group.standeeKey, group.routes),
  );
}
