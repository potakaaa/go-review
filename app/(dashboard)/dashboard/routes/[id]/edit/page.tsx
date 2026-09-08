import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditRouteForm } from "@/app/(dashboard)/dashboard/routes/[id]/edit/edit-route-form";
import { CopyButton } from "@/components/copy-button";
import { QrPanel } from "@/components/qr-panel";
import { Card, LockBadge } from "@/components/ui";
import { ToggleLockButton } from "@/components/toggle-lock-button";
import { publicUrlForSlug } from "@/lib/qr";
import { getRoute } from "@/lib/routes";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Edit route" };

export default async function EditRoutePage({
  params,
}: PageProps<"/dashboard/routes/[id]/edit">) {
  await requirePermission("routes", "manage");
  const { id } = await params;
  const route = await getRoute(id);
  if (!route) notFound();

  const publicUrl = publicUrlForSlug(route.slug);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">04 — route settings</p>
          <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
            Edit route
          </h1>
          <div className="mt-3 flex items-center gap-2">
            <p className="truncate text-sm text-muted">
              {route.business_name}
            </p>
            {route.locked ? <LockBadge /> : null}
          </div>
        </div>
        <ToggleLockButton
          id={route.id}
          locked={route.locked}
          businessName={route.business_name}
          className="w-full sm:w-44"
        />
      </div>

      <Card className="p-5 sm:p-7">
        <EditRouteForm route={route} />
      </Card>

      <details className="rounded-xl border border-line bg-surface">
        <summary className="eyebrow cursor-pointer px-4 py-4 tap-target">
          QR code &amp; link
        </summary>
        <div className="border-t border-line p-5">
          <QrPanel
            url={publicUrl}
            businessName={route.business_name}
            slug={route.slug}
          />
          <div className="mt-2">
            <CopyButton
              value={publicUrl}
              label="Copy link again"
              className="w-full text-sm"
            />
          </div>
        </div>
      </details>
    </div>
  );
}
