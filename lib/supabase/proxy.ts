import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";
import type { Database } from "@/lib/database.types";

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

function securityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
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

  // `getUser` revalidates the token against Supabase. `getSession` only decodes
  // the cookie, which a client could have forged -- never gate on it here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicRecoveryPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "";
    // Send them back where they were headed once they sign in.
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return redirectWithCookies(loginUrl, response, csp);
  }

  if (!user) return securityHeaders(response, csp);

  const { data: isStaff, error: staffError } = await supabase.rpc(
    "is_active_staff",
  );
  if (staffError || !isStaff) {
    if (!staffError) await supabase.auth.signOut({ scope: "local" });
    if (isPath(pathname, LOGIN_PATH)) return securityHeaders(response, csp);

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = staffError ? "?error=access_unavailable" : "?error=not_authorized";
    return redirectWithCookies(loginUrl, response, csp);
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.search = "?error=access_unavailable";
    return redirectWithCookies(loginUrl, response, csp);
  }

  const hasMfa = assurance.currentLevel === "aal2";
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

  return securityHeaders(response, csp);
}
