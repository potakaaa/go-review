import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink, EmptyState, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { platformLabel } from "@/lib/platforms";
import { requirePermission } from "@/lib/permissions";
import { listStandees } from "@/lib/standees";

export const metadata: Metadata = { title: "Standees" };

export default async function StandeesPage() {
  const access = await requirePermission("routes", "view");
  const canManageRoutes =
    access.profile.role === "superadmin" || access.permissions.routes.canManage;

  const standees = await listStandees();

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">02 — counter stands</p>
          <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
            Standees
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            One stand carries two to four QR codes for the same business — one
            per platform — and each QR counts its own scans.
          </p>
        </div>
        {canManageRoutes ? (
          <div className="grid gap-2 sm:flex sm:shrink-0">
            <ButtonLink href="/dashboard/standees/batch/new" variant="secondary">
              Batch standees
            </ButtonLink>
            <ButtonLink href="/dashboard/standees/new">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-4"
                fill="currentColor"
              >
                <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
              </svg>
              New standee
            </ButtonLink>
          </div>
        ) : null}
      </header>

      {standees.length === 0 ? (
        <EmptyState
          title="No standees yet"
          description="Create a stand to give one counter a QR code for each platform."
          action={
            canManageRoutes ? (
              <ButtonLink href="/dashboard/standees/new">
                Create standee
              </ButtonLink>
            ) : null
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {standees.map((standee) => {
            const scans = standee.routes.reduce(
              (total, route) => total + route.scan_count,
              0,
            );

            return (
              <li key={standee.standeeKey}>
                <Link
                  href={`/dashboard/standees/${standee.standeeKey}`}
                  className="block rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-line-strong hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-ink">
                        {standee.businessName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {standee.standeeKey}
                      </p>
                    </div>
                    <StatusBadge
                      active={standee.routes.every((route) => route.active)}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {standee.routes.map((route) => (
                      <span
                        key={route.id}
                        className="rounded-full border border-line-strong px-2.5 py-1 text-xs font-medium text-muted"
                      >
                        {platformLabel(route.platform)}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-subtle tabular-nums">
                    {standee.routes.length} QR codes · {scans}{" "}
                    {scans === 1 ? "scan" : "scans"} · Created{" "}
                    {formatDate(standee.createdAt)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
