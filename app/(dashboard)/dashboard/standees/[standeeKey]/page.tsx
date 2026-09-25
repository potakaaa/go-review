import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyButton } from "@/components/copy-button";
import { QrPanel } from "@/components/qr-panel";
import { Flash } from "@/components/flash";
import {
  ButtonLink,
  Card,
  LockBadge,
  PublicationBadge,
  StatusBadge,
  buttonClass,
} from "@/components/ui";
import { formatDate } from "@/lib/format";
import { platformLabel } from "@/lib/platforms";
import { publicUrlForSlug } from "@/lib/qr";
import { getStandee } from "@/lib/standees";

export const metadata: Metadata = { title: "Standee" };

export default async function StandeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ standeeKey: string }>;
  searchParams: Promise<{ created?: string | string[] }>;
}) {
  const { standeeKey } = await params;
  const { created } = await searchParams;

  const standee = await getStandee(standeeKey);
  // RLS makes another owner's stand indistinguishable from a missing one --
  // which is the correct answer to give in both cases.
  if (!standee) notFound();

  const downloadHref = `/dashboard/standees/${standeeKey}/download`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {created ? (
        <Flash
          title="Standee created"
          description={`${standee.routes.length} QR codes are ready to print onto the stand for ${standee.businessName}.`}
          params={["created"]}
        />
      ) : null}

      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">06 — standee</p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            <span className="block truncate">{standee.businessName}</span>
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">
            {standeeKey} · {standee.routes.length} QR codes ·{" "}
            {standee.routes.map((route) => platformLabel(route.platform)).join(" + ")}{" "}
            · Created {formatDate(standee.createdAt)}
          </p>
        </div>

        <div className="grid gap-2 sm:flex sm:shrink-0">
          <a href={downloadHref} download className={buttonClass("primary")}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-4"
              fill="currentColor"
            >
              <path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3zM5 19h14v2H5z" />
            </svg>
            Download ZIP
          </a>
          <ButtonLink href="/dashboard/standees" variant="secondary">
            All standees
          </ButtonLink>
        </div>
      </header>

      {standee.batchKey ? (
        <Card className="flex flex-col gap-4 border-brand/35 bg-brand-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-brand">Part of a print run</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              This stand was created with others in run {standee.batchKey}.
            </p>
          </div>
          <ButtonLink
            href={`/dashboard/standees/runs/${standee.batchKey}`}
            variant="secondary"
            className="shrink-0"
          >
            View the run
          </ButtonLink>
        </Card>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        {standee.routes.map((route) => {
          const label = platformLabel(route.platform);
          const publicUrl = publicUrlForSlug(route.slug);

          return (
            <Card key={route.id} className="p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4">
                <div className="min-w-0">
                  <p className="eyebrow">
                    QR {route.standee_position} — {label}
                  </p>
                  <p className="mt-1 truncate font-mono text-xs text-muted">
                    /r/{route.slug}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge active={route.active} />
                  {route.locked ? <LockBadge compact /> : null}
                </div>
              </div>

              <QrPanel
                url={publicUrl}
                // The platform lands in the downloaded filename, so two QRs
                // from one stand never arrive as indistinguishable PNGs.
                businessName={`${standee.businessName} ${label}`}
                slug={route.slug}
              />

              <div className="mt-5 grid gap-2">
                <div className="flex gap-2">
                  <a
                    href={route.destination_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary", "flex-1 text-sm")}
                  >
                    Open {label} destination
                  </a>
                  <CopyButton
                    value={route.destination_url}
                    label={`Copy ${label} destination URL`}
                    iconOnly
                  />
                </div>
                <Link
                  href={`/dashboard/routes/${route.id}`}
                  className={buttonClass("secondary", "text-sm")}
                >
                  Manage this QR
                </Link>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-subtle">
                <span className="tabular-nums">
                  {route.scan_count}{" "}
                  {route.scan_count === 1 ? "scan" : "scans"}
                </span>
                <PublicationBadge status={route.publication_status} />
              </div>
            </Card>
          );
        })}
      </div>

      {standee.routes[0]?.notes ? (
        <Card className="px-4 py-3">
          <p className="eyebrow">Notes</p>
          <p className="mt-0.5 text-sm whitespace-pre-wrap">
            {standee.routes[0].notes}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
