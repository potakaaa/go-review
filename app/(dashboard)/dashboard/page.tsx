import type { Metadata } from "next";
import Link from "next/link";

import { RouteCard } from "@/components/route-card";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { getRecentRoutes, getRouteStats } from "@/lib/routes";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface px-5 py-5 sm:px-6">
      <p className="display-heading text-3xl tabular-nums text-ink sm:text-4xl">
        {value}
      </p>
      <p className="eyebrow mt-2">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  // One request, two queries in flight together rather than in sequence.
  const [stats, recent] = await Promise.all([
    getRouteStats(),
    getRecentRoutes(3),
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">01 — workspace</p>
          <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
          Your review cards at a glance.
          </p>
        </div>

        <div className="grid w-full gap-2 sm:flex sm:w-auto">
          <ButtonLink href="/dashboard/routes/new" className="w-full sm:w-auto">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor">
              <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
            </svg>
            New route
          </ButtonLink>
          <ButtonLink
            href="/dashboard/routes/batch/new"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Batch routes
          </ButtonLink>
          <ButtonLink
            href="/dashboard/convert"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Convert link
          </ButtonLink>
        </div>
      </header>

      <div className="grid overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
        <Stat label="Total" value={stats.total} />
        <Stat label="Active" value={stats.active} />
        <Stat label="Inactive" value={stats.inactive} />
      </div>

      {stats.total > 0 ? (
        <Card className="flex items-center justify-between gap-4 px-5 py-4 text-sm text-muted">
          <span className="eyebrow">Activity</span>
          <span className="text-right">
          <span className="font-semibold text-ink tabular-nums">
            {stats.totalScans}
          </span>{" "}
          {stats.totalScans === 1 ? "scan" : "scans"} across all cards
          </span>
        </Card>
      ) : null}

      <section>
        <div className="mb-5 flex items-baseline justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="eyebrow">Recent activity</p>
            <h2 className="display-heading mt-2 text-2xl text-ink">
              Recently created
            </h2>
          </div>
          {stats.total > 0 ? (
            <Link
              href="/dashboard/routes"
              className="text-xs font-medium text-muted transition-colors hover:text-ink"
            >
              View all <span aria-hidden="true">↗</span>
            </Link>
          ) : null}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="No routes yet"
            description="Create your first route to generate a QR code for a card."
            action={
              <ButtonLink href="/dashboard/routes/new">Create Route</ButtonLink>
            }
          />
        ) : (
          <div className="space-y-3">
            {recent.map((route) => (
              <RouteCard key={route.id} route={route} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
