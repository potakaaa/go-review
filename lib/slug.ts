/**
 * Slug generation and validation for permanent card URLs.
 *
 * A slug is printed onto physical cards and burned into NFC tags, so it can
 * never change once issued. Everything here optimises for two things: being
 * unguessable enough that nobody stumbles onto another business's card, and
 * being readable enough to type by hand off the back of a card.
 */

/**
 * Base58: the alphanumerics minus `0 O I l`, which are the characters people
 * reliably misread in print. Sequential IDs are deliberately not used -- they
 * would let anyone walk the whole customer list by incrementing a number.
 */
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const SLUG_LENGTH = 6;
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 32;

export const SLUG_PATTERN = /^[A-Za-z0-9-]+$/;

/**
 * Slugs that would collide with a real path. Compared case-insensitively,
 * because lookups are case-insensitive.
 */
const RESERVED_SLUGS = new Set([
  "r",
  "api",
  "login",
  "logout",
  "dashboard",
  "routes",
  "new",
  "edit",
  "admin",
  "manifest",
  "favicon",
  "icon",
  "robots",
  "sitemap",
  "_next",
  "public",
  "static",
]);

/** A cryptographically random slug, e.g. `a7K3mP`. */
export function generateSlug(length: number = SLUG_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  let slug = "";
  for (const byte of bytes) {
    // 256 is not a multiple of 58, so the modulo is very slightly biased.
    // Irrelevant here: the alphabet is only ever used for collision avoidance,
    // not for anything that depends on uniform randomness.
    slug += ALPHABET[byte % ALPHABET.length];
  }
  return slug;
}

export type SlugValidation =
  | { ok: true; slug: string }
  | { ok: false; error: string };

/** Validates an admin-supplied custom slug. */
export function validateCustomSlug(input: string): SlugValidation {
  const slug = input.trim();

  if (slug.length < SLUG_MIN_LENGTH) {
    return {
      ok: false,
      error: `Custom slug must be at least ${SLUG_MIN_LENGTH} characters.`,
    };
  }
  if (slug.length > SLUG_MAX_LENGTH) {
    return {
      ok: false,
      error: `Custom slug must be ${SLUG_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: "Custom slug can only contain letters, numbers and hyphens.",
    };
  }
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return { ok: false, error: "Custom slug cannot start or end with a hyphen." };
  }
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return { ok: false, error: `"${slug}" is reserved. Pick another slug.` };
  }

  return { ok: true, slug };
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}
