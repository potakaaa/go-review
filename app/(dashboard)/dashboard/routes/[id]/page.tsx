import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { QrPanel } from "@/components/qr-panel";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { Alert, Card, StatusBadge, buttonClass } from "@/components/ui";
import { formatDate, formatRelativeDate } from "@/lib/format";
import { publicUrlForSlug } from "@/lib/qr";
import { getRoute } from "@/lib/routes";

export const metadata: Metadata = { title: "Route" };

export default async function RouteDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/routes/[id]">) {
  const { id } = await params;
  const { created, saved } = await searchParams;

  const route = await getRoute(id);
  // RLS makes another owner's route indistinguishable from a missing one --
  // which is the correct answer to give in both cases.
  if (!route) notFound();

  const publicUrl = publicUrlForSlug(route.slug);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {created ? (
        <Alert tone="ok" title="Route created">
          Print or write this QR code onto the card for {route.business_name}.
        </Alert>
      ) : null}
      {saved ? <Alert tone="ok">Changes saved.</Alert> : null}

      <div className="flex items-start justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0">
          <p className="eyebrow">06 — route detail</p>
          <h1 className="display-heading mt-3 truncate text-3xl text-ink sm:text-4xl">
            {route.business_name}
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">/r/{route.slug}</p>
        </div>
        <StatusBadge active={route.active} />
      </div>

      <Card className="p-5 sm:p-8">
        <QrPanel
          url={publicUrl}
          businessName={route.business_name}
          slug={route.slug}
        />
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={route.destination_url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "text-sm")}
        >
          Open destination
        </a>
        <Link
          href={`/dashboard/routes/${route.id}/edit`}
          className={buttonClass("secondary", "text-sm")}
        >
          Edit route
        </Link>
      </div>

      <Card className="divide-y divide-line">
        {route.maps_url ? (
          <div className="px-4 py-3">
            <p className="eyebrow">Original Google Maps link</p>
            <a
              href={route.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block break-anywhere text-sm text-brand underline underline-offset-2"
            >
              {route.maps_url}
            </a>
          </div>
        ) : null}
        <div className="px-4 py-3">
          <p className="eyebrow">Destination</p>
          <p className="mt-0.5 break-anywhere text-sm">
            {route.destination_url}
          </p>
        </div>
        {route.notes ? (
          <div className="px-4 py-3">
          <p className="eyebrow">Notes</p>
            <p className="mt-0.5 text-sm whitespace-pre-wrap">{route.notes}</p>
          </div>
        ) : null}
        <div className="px-4 py-3">
          <p className="eyebrow">Scans</p>
          <p className="mt-0.5 text-sm tabular-nums">
            {route.scan_count}
            {route.last_scanned_at
              ? ` · last ${formatRelativeDate(route.last_scanned_at).toLowerCase()}`
              : " · not scanned yet"}
          </p>
        </div>
        <div className="px-4 py-3">
          <p className="eyebrow">Created</p>
          <p className="mt-0.5 text-sm">{formatDate(route.created_at)}</p>
        </div>
      </Card>

      <ToggleActiveButton
        id={route.id}
        active={route.active}
        businessName={route.business_name}
      />
    </div>
  );
}
