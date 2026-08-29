import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert, ButtonLink, Card, StatusBadge, buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { publicUrlForSlug } from "@/lib/qr";
import { getBatchRoutes } from "@/lib/routes";

export const metadata: Metadata = { title: "Route batch" };

export default async function BatchRoutesPage({
  params,
  searchParams,
}: {
  params: Promise<{ batchKey: string }>;
  searchParams: Promise<{ created?: string | string[] }>;
}) {
  const { batchKey } = await params;
  const { created } = await searchParams;
  const routes = await getBatchRoutes(batchKey);

  if (routes.length === 0) notFound();

  const firstRoute = routes[0];
  const createdCount = routes.length;

  return (
    <div className="space-y-8 pb-16">
      {created ? (
        <Alert tone="ok" title="Batch created">
          {createdCount} {createdCount === 1 ? "route is" : "routes are"} ready
          for download and printing.
        </Alert>
      ) : null}

      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">04 — print run</p>
          <h1 className="display-heading mt-3 text-3xl text-ink sm:text-4xl">
            <span className="block truncate">{firstRoute.business_name}</span>
          </h1>
          <p className="mt-2 font-mono text-xs text-muted">
            Batch {batchKey} · {createdCount}{" "}
            {createdCount === 1 ? "route" : "routes"} · Created{" "}
            {formatDate(firstRoute.created_at)}
          </p>
        </div>

        <div className="grid gap-2 sm:flex sm:shrink-0">
          <a
            href={"/dashboard/routes/batches/" + batchKey + "/download"}
            download
            className={buttonClass("primary")}
          >
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
          <ButtonLink href="/dashboard/routes" variant="secondary">
            All routes
          </ButtonLink>
        </div>
      </header>

      <Card className="flex flex-col gap-4 border-brand/35 bg-brand-soft px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow text-brand">Print-ready export</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            The ZIP contains {createdCount} high-resolution QR PNGs plus a
            manifest.csv that maps each file to its permanent slug.
          </p>
        </div>
        <a
          href={"/dashboard/routes/batches/" + batchKey + "/download"}
          download
          className={buttonClass("secondary", "shrink-0")}
        >
          Download again
        </a>
      </Card>

      <section>
        <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="eyebrow">Cards in this batch</p>
            <h2 className="display-heading mt-2 text-2xl text-ink">
              {createdCount} numbered links
            </h2>
          </div>
          <span className="font-mono text-xs text-subtle">
            {batchKey}-1 → {batchKey}-{createdCount}
          </span>
        </div>

        <Card className="divide-y divide-line overflow-hidden">
          {routes.map((route, index) => {
            const position = route.batch_position ?? index + 1;
            const publicUrl = publicUrlForSlug(route.slug);

            return (
              <div
                key={route.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="eyebrow">Card {position}</p>
                  <p className="mt-1 truncate font-mono text-sm text-ink">
                    /r/{route.slug}
                  </p>
                  <p className="mt-1 truncate text-xs text-subtle">
                    {publicUrl}
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <StatusBadge active={route.active} />
                  <Link
                    href={"/dashboard/routes/" + route.id}
                    className={buttonClass("secondary", "text-xs")}
                  >
                    View QR
                  </Link>
                </div>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}
