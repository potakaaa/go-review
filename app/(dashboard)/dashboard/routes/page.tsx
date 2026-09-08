import type { Metadata } from "next";

import { RouteCard } from "@/components/route-card";
import { RouteFilters } from "@/components/route-filters";
import { Alert, ButtonLink, Card, EmptyState } from "@/components/ui";
import { listRoutes, parseFilters } from "@/lib/routes";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Routes" };

export default async function RoutesPage({
  searchParams,
}: PageProps<"/dashboard/routes">) {
  const access = await requirePermission("routes", "view");
  const canManageRoutes =
    access.profile.role === "superadmin" || access.permissions.routes.canManage;
  const params = await searchParams;
  const filters = parseFilters(params);
  const routes = await listRoutes(filters);
  const updatedValue = Array.isArray(params.updated)
    ? params.updated[0]
    : params.updated;
  const updatedCount = Number(updatedValue);

  const isFiltered = filters.q !== "" || filters.status !== "all";

  return (
    <div className="space-y-8 pb-16">
      {Number.isInteger(updatedCount) && updatedCount > 0 ? (
        <Alert tone="ok" title="Routes updated">
          {updatedCount} {updatedCount === 1 ? "route was" : "routes were"}{" "}
          updated successfully.
        </Alert>
      ) : null}

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
          {canManageRoutes ? (
            <>
              <ButtonLink href="/dashboard/routes/batch/edit" variant="secondary">
                Batch edit
              </ButtonLink>
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
            </>
          ) : null}
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
            action={canManageRoutes ? (
              <ButtonLink href="/dashboard/routes/new">Create Route</ButtonLink>
            ) : undefined}
          />
        )
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3 lg:grid-cols-2">
          {routes.map((route) => (
            <RouteCard key={route.id} route={route} canManage={canManageRoutes} />
          ))}
        </div>
      )}
    </div>
  );
}
