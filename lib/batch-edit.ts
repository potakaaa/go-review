export const BATCH_EDIT_MAX_SIZE = 500;

export type NamedRoute = {
  id: string;
  business_name: string;
};

const TRAILING_NUMBER = /^(.*?)-(\d+)$/;

/**
 * Keeps the route list stable for the user and makes numeric suffixes sort in
 * the order people expect: `restaurant-2` before `restaurant-10`.
 */
export function sortRoutesByBusinessName<T extends NamedRoute>(
  routes: readonly T[],
): T[] {
  const collator = new Intl.Collator("en", {
    numeric: true,
    sensitivity: "base",
  });

  return [...routes].sort(
    (left, right) =>
      collator.compare(left.business_name, right.business_name) ||
      left.id.localeCompare(right.id),
  );
}

/**
 * Turns `restaurant-1` into `restaurant-1`, `restaurant-2`, ... . A seed
 * without a suffix starts at one, so `restaurant` becomes `restaurant-1`.
 */
export function incrementedRouteNames(seed: string, count: number): string[] {
  const value = seed.trim();
  if (!value || count < 1) return [];

  const match = value.match(TRAILING_NUMBER);
  const stem = match?.[1]?.trimEnd() || value;
  const parsedStart = match?.[2] ? Number(match[2]) : 1;
  const start = Number.isSafeInteger(parsedStart) ? parsedStart : 1;
  const width = match?.[2]?.length ?? 0;

  return Array.from({ length: count }, (_, index) => {
    const number = String(start + index).padStart(width, "0");
    return `${stem}-${number}`;
  });
}
