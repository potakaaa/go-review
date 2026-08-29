import type { Metadata } from "next";

import { RouteCard } from "@/components/route-card";
import { RouteFilters } from "@/components/route-filters";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { listRoutes, parseFilters } from "@/lib/routes";

export const metadata: Metadata = { title: "Routes" };

export default async function RoutesPage({
  searchParams,
}: PageProps<"/dashboard/routes">) {
  const filters = parseFilters(await searchParams);
  const routes = await listRoutes(filters);

  const isFiltered = filters.q !== "" || filters.status !== "all";

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">02 — permanent links</p>
          <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
            Routes
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Every route is a permanent destination for a printed card or NFC tag.
          </p>
        </div>
        <div className="grid gap-2 sm:flex">
          <ButtonLink href="/dashboard/routes/batch/new" variant="secondary">
            Batch routes
          </ButtonLink>
          <ButtonLink
            href="/dashboard/routes/new"
            className="hidden sm:inline-flex"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-4"
              fill="currentColor"
            >
              <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
            </svg>
            New route
          </ButtonLink>
        </div>
      </header>

      <Card className="p-3 sm:p-5">
        <p className="eyebrow mb-3 sm:mb-4">Find a route</p>
        <RouteFilters total={routes.length} />
      </Card>

      {routes.length === 0 ? (
        isFiltered ? (
          <EmptyState
            title="No matching routes"
            description="Try a different search term, or clear the status filter."
          />
        ) : (
          <EmptyState
            title="No routes yet"
            description="Create your first route to generate a QR code for a card."
            action={
              <ButtonLink href="/dashboard/routes/new">Create Route</ButtonLink>
            }
          />
        )
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      )}

      {/* Sits above the bottom nav so creating a route is always one tap away,
          however far down you have scrolled. */}
      <div className="pointer-events-none fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 px-0 sm:inset-x-6 md:hidden">
        <div className="pointer-events-auto mx-auto max-w-md">
          <ButtonLink
            href="/dashboard/routes/new"
            className="mobile-create-cta w-full shadow-2xl shadow-black/40"
          >
            <span className="mobile-create-cta-content">
              <span aria-hidden="true" className="flex size-5 items-center justify-center">
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                  <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
                </svg>
              </span>
              <span>New route</span>
            </span>
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
