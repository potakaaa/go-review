import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const RECOVERY_TYPES = new Set<EmailOtpType>([
  "recovery",
  "invite",
  "magiclink",
  "email",
]);

/** Reasons the recovery form knows how to explain. */
type Reason = "expired_link" | "used_link" | "wrong_browser" | "invalid_link";

function bounce(request: NextRequest, reason: Reason): NextResponse {
  return NextResponse.redirect(
    new URL(`/forgot-password?error=${reason}`, request.url),
    303,
  );
}

/**
 * Turns a recovery email link into a session.
 *
 * Supabase can hand us either shape, so both are honoured:
 *
 * - `token_hash` + `type`, which verifies against the server alone. This is the
 *   one that survives a link opened on a different device from the one that
 *   asked for it -- the common case when the request is made on a laptop and
 *   the email is read on a phone.
 * - `code`, the PKCE exchange, which additionally needs the code-verifier
 *   cookie this browser stored when the link was requested.
 *
 * Supabase may also redirect here with its own error, which we translate rather
 * than flattening into one unhelpful message.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;

  const errorCode = params.get("error_code") ?? params.get("error");
  if (errorCode) {
    console.error("[auth] password_recovery_link_rejected", {
      code: errorCode,
      description: params.get("error_description"),
    });
    return bounce(
      request,
      errorCode === "otp_expired" ? "expired_link" : "invalid_link",
    );
  }

  const supabase = await createClient();

  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash && type && RECOVERY_TYPES.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (!error) {
      return NextResponse.redirect(new URL("/reset-password", request.url), 303);
    }

    console.error("[auth] password_recovery_verify_failed", {
      code: error.code,
      status: error.status,
    });
    return bounce(
      request,
      error.code === "otp_expired" ? "expired_link" : "used_link",
    );
  }

  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL("/reset-password", request.url), 303);
    }

    console.error("[auth] password_recovery_exchange_failed", {
      code: error.code,
      status: error.status,
    });

    // No verifier cookie means the link was opened somewhere other than the
    // browser that asked for it, or a newer request overwrote it. That is a
    // different fix for the reader than an expired token, so say so.
    const missingVerifier =
      error.code === "validation_failed" ||
      /code verifier/i.test(error.message);
    return bounce(request, missingVerifier ? "wrong_browser" : "used_link");
  }

  console.error("[auth] password_recovery_link_incomplete", {
    params: [...params.keys()].join(","),
  });
  return bounce(request, "invalid_link");
}
