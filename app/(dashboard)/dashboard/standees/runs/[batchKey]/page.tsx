import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Flash } from "@/components/flash";
import { ButtonLink, Card, StatusBadge, buttonClass } from "@/components/ui";
import { BATCH_KEY_PATTERN } from "@/lib/batch";
import { formatDate } from "@/lib/format";
import { platformLabel } from "@/lib/platforms";
import { publicUrlForSlug } from "@/lib/qr";
import { getStandeeRun } from "@/lib/standees";

export const metadata: Metadata = { title: "Standee run" };

export default async function StandeeRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchKey: string }>;
  searchParams: Promise<{ created?: string | string[] }>;
}) {
  const { batchKey } = await params;
  const { created } = await searchParams;

  if (!BATCH_KEY_PATTERN.test(batchKey)) notFound();

  const standees = await getStandeeRun(batchKey);
  if (standees.length === 0) notFound();

  const first = standees[0];
  const slots = first.routes.length;
  const downloadHref = `/dashboard/routes/batches/${batchKey}/download`;

  return (
    <div className="space-y-8 pb-16">
      {created ? (
        <Flash
          title="Standee run created"
          description={`${standees.length} stands with ${slots} QR codes each are ready for download and printing.`}
          params={["created"]}
        />
      ) : null}

      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">04 — standee run</p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            <span className="block truncate">{first.businessName}</span>
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">
            Run {batchKey} · {standees.length} stands · {slots} QR codes each ·{" "}
            {first.routes.map((route) => platformLabel(route.platform)).join(" + ")}{" "}
            · Created {formatDate(first.createdAt)}
          </p>
        </div>

        <div className="grid gap-2 sm:flex sm:shrink-0">
          <a href={downloadHref} download className={buttonClass("primary")}>
            Download ZIP
          </a>
          <ButtonLink href="/dashboard/standees" variant="secondary">
            All standees
          </ButtonLink>
        </div>
      </header>

      <Card className="flex flex-col gap-4 border-brand/35 bg-brand-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-brand">Print-ready export</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            The ZIP contains {standees.length * slots} high-resolution QR PNGs
            plus a manifest.csv naming the stand and platform each file belongs
            to.
          </p>
        </div>
        <a
          href={downloadHref}
          download
          className={buttonClass("secondary", "shrink-0")}
        >
          Download again
        </a>
      </Card>

      <section>
        <div className="mb-5 border-b border-line pb-4">
          <p className="eyebrow">Stands in this run</p>
          <h2 className="display-heading mt-2 text-2xl text-ink">
            {standees.length} standees
          </h2>
        </div>

        <Card className="divide-y divide-line overflow-hidden">
          {standees.map((standee, index) => (
            <div
              key={standee.standeeKey}
              className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="min-w-0">
                <p className="eyebrow">Stand {index + 1}</p>
                <p className="mt-1 truncate font-mono text-sm text-ink">
                  {standee.standeeKey}
                </p>
                <p className="mt-1 truncate text-xs text-subtle">
                  {standee.routes
                    .map(
                      (route) =>
                        `${platformLabel(route.platform)} · ${publicUrlForSlug(route.slug)}`,
                    )
                    .join("  ·  ")}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <StatusBadge
                  active={standee.routes.every((route) => route.active)}
                />
                <Link
                  href={`/dashboard/standees/${standee.standeeKey}`}
                  className={buttonClass("secondary", "text-xs")}
                >
                  View QRs
                </Link>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}
