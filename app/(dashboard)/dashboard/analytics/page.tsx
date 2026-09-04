import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { formatRelativeDate } from "@/lib/format";
import { getMostUsedRoutes, getRouteStats } from "@/lib/routes";

export const metadata: Metadata = { title: "Analytics" };

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface px-4 py-4 sm:px-5 sm:py-5">
      <p className="display-heading text-3xl tabular-nums text-ink sm:text-4xl">
        {value}
      </p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const [stats, routes] = await Promise.all([
    getRouteStats(),
    getMostUsedRoutes(10),
  ]);
  const usedRoutes = routes.filter((route) => route.scan_count > 0);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">03 — usage</p>
          <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
            Analytics
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            See which permanent links are getting used most.
          </p>
        </div>
        <div className="grid gap-2 sm:flex">
          <ButtonLink href="/dashboard/routes?sort=most-used" variant="secondary">
            Most used in routes
          </ButtonLink>
          <ButtonLink href="/dashboard/routes" variant="secondary">
            All routes
          </ButtonLink>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
        <Metric label="Total scans" value={stats.totalScans} />
        <Metric label="Used links" value={stats.scanned} />
        <Metric label="Active links" value={stats.active} />
        <Metric label="All links" value={stats.total} />
      </div>

      <section>
        <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="eyebrow">All-time usage</p>
            <h2 className="display-heading mt-2 text-2xl text-ink">
              Most used links
            </h2>
          </div>
          <span className="hidden text-xs text-subtle sm:inline">
            Ranked by scans
          </span>
        </div>

        {usedRoutes.length === 0 ? (
          <EmptyState
            title="No scans yet"
            description="When someone scans a printed card, its route will appear here."
            action={<ButtonLink href="/dashboard/routes">View routes</ButtonLink>}
          />
        ) : (
          <Card className="overflow-hidden divide-y divide-line">
            <ol aria-label="Most used routes">
              {usedRoutes.map((route, index) => (
                <li
                  key={route.id}
                  className="flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5"
                >
                  <span
                    aria-hidden="true"
                    className="w-5 shrink-0 text-center font-mono text-xs text-subtle tabular-nums"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/dashboard/routes/${route.id}/edit`}
                      className="block truncate text-sm font-semibold tracking-tight text-ink underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {route.business_name}
                    </Link>
                    <p className="mt-1 truncate font-mono text-[11px] text-muted">
                      /r/{route.slug}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-subtle">
                      {route.active ? "Active" : "Inactive"} · last used{" "}
                      {route.last_scanned_at
                        ? formatRelativeDate(route.last_scanned_at).toLowerCase()
                        : "unknown"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-lg font-medium tabular-nums text-ink">
                      {route.scan_count}
                    </p>
                    <p className="eyebrow mt-1">scans</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        )}
      </section>

      <p className="max-w-xl text-xs leading-5 text-subtle">
        Counts represent visits to a route, not unique people. No IP addresses,
        user agents, or other visitor details are stored.
      </p>
    </div>
  );
}
