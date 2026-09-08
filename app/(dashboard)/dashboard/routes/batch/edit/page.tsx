import type { Metadata } from "next";

import { BatchEditRoutesForm } from "@/app/(dashboard)/dashboard/routes/batch/edit/batch-edit-routes-form";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { getRoutesForBatchEdit } from "@/lib/routes";

export const metadata: Metadata = { title: "Batch edit routes" };

export default async function BatchEditRoutesPage() {
  const routes = await getRoutesForBatchEdit();

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">05 — batch update</p>
          <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
            Batch edit
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            Select routes, give them numbered business names, and point them to
            one review destination. Printed public links stay fixed.
          </p>
        </div>
        <ButtonLink href="/dashboard/routes" variant="secondary">
          All routes
        </ButtonLink>
      </header>

      {routes.length === 0 ? (
        <EmptyState
          title="No routes to edit"
          description="Create a route first, then return here to update several at once."
          action={
            <ButtonLink href="/dashboard/routes/new">Create route</ButtonLink>
          }
        />
      ) : (
        <Card className="p-5 sm:p-7">
          <BatchEditRoutesForm
            routes={routes.map((route) => ({
              id: route.id,
              slug: route.slug,
              business_name: route.business_name,
              active: route.active,
              locked: route.locked,
              scan_count: route.scan_count,
            }))}
          />
        </Card>
      )}
    </div>
  );
}
