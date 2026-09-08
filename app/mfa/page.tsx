import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MfaForm } from "@/app/mfa/mfa-form";
import { Card } from "@/components/ui";
import { checkStaffAccess } from "@/lib/auth";
import { safeNextPath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Security verification" };

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const access = await checkStaffAccess(supabase);

  if (access.state === "anonymous" || access.state === "unapproved") {
    redirect("/login");
  }
  if (access.state === "unavailable") {
    redirect("/login?error=access_unavailable");
  }
  if (access.state === "ready") redirect(safeNextPath(params.next));

  return (
    <main className="relative flex min-h-dvh flex-col justify-center overflow-hidden px-5 py-12">
      <div
        aria-hidden="true"
        className="page-grid pointer-events-none absolute inset-0 opacity-60"
      />
      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-8">
          <div
            aria-hidden="true"
            className="mb-6 flex size-11 items-center justify-center rounded-md border border-line-strong bg-surface font-mono text-xs font-medium tracking-tight text-ink"
          >
            2FA
          </div>
          <p className="eyebrow">Goreview / identity check</p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            Verify it&apos;s you
          </h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            Every staff session needs a fresh code from an authenticator app
            before client routes can be viewed or changed.
          </p>
        </div>

        <Card className="bg-surface/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6">
          <MfaForm next={safeNextPath(params.next)} />
        </Card>
      </div>
    </main>
  );
}
