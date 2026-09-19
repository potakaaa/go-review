import { generateSlug } from "@/lib/slug";
import { BATCH_MAX_SIZE } from "@/lib/batch";
import type { RoutePlatform } from "@/lib/platforms";

/**
 * A standee is a printed stand that carries several QR codes for one business
 * -- "Facebook · Google Maps" in the current artwork. Each QR is a normal
 * route; this module only describes how they are grouped and named.
 */

/** Seven readable random characters identify one physical stand. */
export const STANDEE_KEY_LENGTH = 7;
export const STANDEE_KEY_PATTERN = new RegExp(
  `^[A-Za-z0-9]{${STANDEE_KEY_LENGTH}}$`,
);

/** Two QRs is the product in the photo; four is what the artwork can fit. */
export const STANDEE_MIN_SLOTS = 2;
export const STANDEE_MAX_SLOTS = 4;

export const STANDEE_BATCH_MIN_SIZE = 2;

export function generateStandeeKey(): string {
  return generateSlug(STANDEE_KEY_LENGTH);
}

/** `Kx9mQ2t` + `2` -> `Kx9mQ2t-2`. */
export function standeeSlug(standeeKey: string, position: number): string {
  return `${standeeKey}-${position}`;
}

export function standeeZipFileName(standeeKey: string): string {
  return `standee-${standeeKey}.zip`;
}

export function standeeRunZipFileName(batchKey: string): string {
  return `standee-run-${batchKey}.zip`;
}

/**
 * A run of standees is stored as one route batch, and `batch_position` is
 * capped at {@link BATCH_MAX_SIZE}. Four QRs per stand therefore means at most
 * 25 stands in a single run.
 */
export function maxStandeeBatchSize(slots: number): number {
  const safeSlots = Math.min(
    Math.max(Math.floor(slots) || STANDEE_MIN_SLOTS, STANDEE_MIN_SLOTS),
    STANDEE_MAX_SLOTS,
  );
  return Math.floor(BATCH_MAX_SIZE / safeSlots);
}

export type StandeeSlot = {
  platform: RoutePlatform;
  destination_url: string;
  maps_url: string | null;
};

/**
 * Two QRs on one stand may share a platform -- a Facebook page next to a
 * Facebook reviews tab is legitimate -- but never a destination, which would
 * print the same link twice and make the second QR pointless.
 */
export function duplicateDestinationIndex(
  destinations: readonly string[],
): number {
  const seen = new Set<string>();
  for (let index = 0; index < destinations.length; index++) {
    const key = destinations[index].trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) return index;
    seen.add(key);
  }
  return -1;
}

/** Groups routes into stands, preserving the order the rows arrived in. */
export function groupRoutesByStandee<
  T extends { standee_key: string | null; standee_position: number | null },
>(routes: readonly T[]): Array<{ standeeKey: string; routes: T[] }> {
  const groups = new Map<string, T[]>();

  for (const route of routes) {
    if (!route.standee_key) continue;
    const existing = groups.get(route.standee_key);
    if (existing) existing.push(route);
    else groups.set(route.standee_key, [route]);
  }

  return Array.from(groups, ([standeeKey, grouped]) => ({
    standeeKey,
    routes: grouped.sort(
      (a, b) => (a.standee_position ?? 0) - (b.standee_position ?? 0),
    ),
  }));
}
