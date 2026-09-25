import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/database.types";
import { resolveStaffAccess } from "@/lib/staff-access";

const LOGIN_PATH = "/login";
const MFA_PATH = "/mfa";
const FORGOT_PASSWORD_PATH = "/forgot-password";
const RESET_PASSWORD_PATH = "/reset-password";
const AUTH_CALLBACK_PATH = "/auth/callback";

function isPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function isPublicRecoveryPath(pathname: string): boolean {
  return (
    isPath(pathname, LOGIN_PATH) ||
    isPath(pathname, FORGOT_PASSWORD_PATH) ||
    isPath(pathname, AUTH_CALLBACK_PATH)
  );
}

function securityHeaders(
  response: NextResponse,
  csp: string,
  authMs?: number,
): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
  // Visible in DevTools > Network > Timing, so a slow click can be split into
  // "access check" and "everything after it" without guessing.
  if (authMs !== undefined) {
    response.headers.set("Server-Timing", `auth;desc="Access check";dur=${authMs.toFixed(1)}`);
  }
  return response;
}

function redirectWithCookies(
  url: URL,
  cookieSource: NextResponse,
  csp: string,
): NextResponse {
  const redirectResponse = NextResponse.redirect(url);
  for (const cookie of cookieSource.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  return securityHeaders(redirectResponse, csp);
}

/**
 * Refreshes the Supabase auth cookie on every request and gates the dashboard.
 *
 * The refresh matters most on mobile: iOS Safari aggressively suspends tabs, so
 * without a server-side refresh a phone left in a pocket between cafe visits
 * would come back to an expired session and a bounce to /login.
 */
export async function updateSession(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const isDevelopment = process.env.NODE_ENV === "development";
  const supabaseOrigin = new URL(supabaseUrl()).origin;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin} https://challenges.cloudflare.com`,
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  function nextResponse() {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  let response = nextResponse();

  const supabase = createServerClient<Database>(
    supabaseUrl(),
    supabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = nextResponse();
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // One access decision shared with every server render: signature-verified
  // claims (no Auth round trip) plus one staff-state RPC. See
  // resolveStaffAccess for the trade-off.
  const startedAt = performance.now();
  const { state } = await resolveStaffAccess(supabase);
  const authMs = performance.now() - startedAt;

  const { pathname, search } = request.nextUrl;

  if (state === "anonymous" && !isPublicRecoveryPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    // Send them back where they were headed once they sign in.
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return redirectWithCookies(loginUrl, response, csp);
  }

  if (state === "anonymous") return securityHeaders(response, csp, authMs);

  if (state === "unapproved" || state === "unavailable") {
    if (state === "unapproved") await supabase.auth.signOut({ scope: "local" });
    if (isPath(pathname, LOGIN_PATH)) return securityHeaders(response, csp, authMs);

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = state === "unavailable" ? "?error=access_unavailable" : "?error=not_authorized";
    return redirectWithCookies(loginUrl, response, csp);
  }

  if (state === "needs_password_change" && !isPath(pathname, RESET_PASSWORD_PATH)) {
    const resetUrl = request.nextUrl.clone();
    resetUrl.pathname = RESET_PASSWORD_PATH;
    resetUrl.search = "?required=1";
    return redirectWithCookies(resetUrl, response, csp);
  }

  // A pending password change is resolved before MFA, exactly as before: the
  // reset page is reachable, and nothing else is.
  if (state === "needs_password_change") return securityHeaders(response, csp, authMs);
  const hasMfa = state === "ready";

  if (
    !hasMfa &&
    !isPath(pathname, MFA_PATH) &&
    !isPath(pathname, RESET_PASSWORD_PATH)
  ) {
    const mfaUrl = request.nextUrl.clone();
    mfaUrl.pathname = MFA_PATH;
    mfaUrl.search = "";
    if (!isPath(pathname, LOGIN_PATH) && pathname !== "/") {
      mfaUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return redirectWithCookies(mfaUrl, response, csp);
  }

  if (hasMfa && (isPath(pathname, LOGIN_PATH) || isPath(pathname, MFA_PATH))) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return redirectWithCookies(dashboardUrl, response, csp);
  }

  return securityHeaders(response, csp, authMs);
}
