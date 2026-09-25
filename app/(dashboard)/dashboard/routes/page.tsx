import type { Metadata } from "next";

import { Flash } from "@/components/flash";
import { RouteBrowser } from "@/components/route-browser";
import { ButtonLink } from "@/components/ui";
import { listRouteSummaries } from "@/lib/routes";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Routes" };

export default async function RoutesPage({
  searchParams,
}: PageProps<"/dashboard/routes">) {
  const access = await requirePermission("routes", "view");
  const canManageRoutes =
    access.profile.role === "superadmin" || access.permissions.routes.canManage;
  const params = await searchParams;
  const routes = await listRouteSummaries();
  const updatedValue = Array.isArray(params.updated)
    ? params.updated[0]
    : params.updated;
  const updatedCount = Number(updatedValue);

  return (
    <div className="space-y-8 pb-16">
      {Number.isInteger(updatedCount) && updatedCount > 0 ? (
        <Flash
          title="Routes updated"
          description={`${updatedCount} ${updatedCount === 1 ? "route was" : "routes were"} updated.`}
          params={["updated"]}
        />
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
          <ButtonLink href="/dashboard/standees" variant="secondary">
            Standees
          </ButtonLink>
          {canManageRoutes ? (
            <>
              <ButtonLink href="/dashboard/routes/batch/edit" variant="secondary">
                Batch edit
              </ButtonLink>
              <ButtonLink href="/dashboard/routes/batch/new" prefetch variant="secondary">
                Batch routes
              </ButtonLink>
              <ButtonLink
                href="/dashboard/routes/new"
                prefetch
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

      <RouteBrowser routes={routes} canManage={canManageRoutes} />
    </div>
  );
}
