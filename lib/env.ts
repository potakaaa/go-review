/**
 * Environment access with loud, early failures.
 *
 * A misconfigured deploy that silently falls back to a default would mean
 * printed cards pointing at the wrong origin, so every getter throws instead.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

export function supabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Server-only. Bypasses RLS. */
export function supabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Origin the QR codes encode, without a trailing slash.
 *
 * Falls back to the current origin only in the browser, so a forgotten env var
 * during local development still produces a working (if local) QR code.
 */
export function redirectBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_REDIRECT_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  throw new Error(
    "Missing environment variable NEXT_PUBLIC_REDIRECT_BASE_URL. Copy .env.example to .env.local and fill it in.",
  );
}
