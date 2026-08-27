import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditRouteForm } from "@/app/(dashboard)/dashboard/routes/[id]/edit/edit-route-form";
import { CopyButton } from "@/components/copy-button";
import { QrPanel } from "@/components/qr-panel";
import { Card } from "@/components/ui";
import { publicUrlForSlug } from "@/lib/qr";
import { getRoute } from "@/lib/routes";

export const metadata: Metadata = { title: "Edit route" };

export default async function EditRoutePage({
  params,
}: PageProps<"/dashboard/routes/[id]/edit">) {
  const { id } = await params;
  const route = await getRoute(id);
  if (!route) notFound();

  const publicUrl = publicUrlForSlug(route.slug);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">04 — route settings</p>
        <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
          Edit route
        </h1>
        <p className="mt-3 truncate text-sm text-muted">
          {route.business_name}
        </p>
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
