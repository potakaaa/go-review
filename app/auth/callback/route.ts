import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(
        new URL("/reset-password", request.url),
        303,
      );
    }

    console.error("[auth] password_recovery_exchange_failed", {
      code: error.code,
    });
  }

  return NextResponse.redirect(
    new URL("/forgot-password?error=invalid_link", request.url),
    303,
  );
}
