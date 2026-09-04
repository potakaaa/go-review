import Link from "next/link";

import { CopyButton } from "@/components/copy-button";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { Card, LockBadge, StatusBadge, buttonClass } from "@/components/ui";
import { domainOf, formatDate } from "@/lib/format";
import { publicUrlForSlug } from "@/lib/qr";
import type { RedirectRoute } from "@/lib/database.types";

function MobileStatus({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
        active
          ? "border-ok/30 bg-ok-soft text-ok"
          : "border-line bg-elevated text-subtle"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${active ? "bg-ok" : "bg-subtle"}`}
      />
      {active ? "Active" : "Off"}
    </span>
  );
}

function CompactRouteCard({ route }: { route: RedirectRoute }) {
  const publicUrl = publicUrlForSlug(route.slug);

  return (
    <Card className="flex h-full flex-col p-3">
      <Link
        href={`/dashboard/routes/${route.id}/edit`}
        aria-label={`Edit ${route.business_name}`}
        className="group block min-h-11 flex-1 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <div className="flex items-start justify-between gap-2">
          <MobileStatus active={route.active} />
          <span className="flex items-center gap-1 text-subtle">
            {route.locked ? <LockBadge compact /> : null}
            <span
              aria-hidden="true"
              className="text-sm transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
            >
              ↗
            </span>
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 tracking-tight text-ink">
          {route.business_name}
        </h3>
        <p className="mt-2 truncate font-mono text-[11px] text-muted">
          /r/{route.slug}
        </p>

        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs text-subtle">
            <span className="font-semibold tabular-nums text-ink">
              {route.scan_count}
            </span>{" "}
            {route.scan_count === 1 ? "scan" : "scans"}
          </p>
          <p className="mt-1 text-[11px] text-subtle">
            {route.active ? "Live link" : "Deactivated"}
          </p>
        </div>
      </Link>

      <CopyButton
        value={publicUrl}
        label="Copy"
        copiedLabel="Copied"
        className="mt-3 w-full px-2 text-xs"
      />
    </Card>
  );
}

function FullRouteCard({ route }: { route: RedirectRoute }) {
  const publicUrl = publicUrlForSlug(route.slug);

  return (
    <Card className="flex h-full flex-col p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium tracking-tight">
            {route.business_name}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted">/r/{route.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge active={route.active} />
          {route.locked ? <LockBadge /> : null}
        </div>
      </div>

      <dl className="mt-5 space-y-3 border-t border-line pt-4 text-sm">
        <div className="flex gap-2">
          <dt className="eyebrow w-16 shrink-0 pt-0.5">Link</dt>
          <dd className="break-anywhere font-mono text-xs text-ink">
            {publicUrl}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="eyebrow w-16 shrink-0 pt-0.5">Goes to</dt>
          <dd className="truncate text-muted">{domainOf(route.destination_url)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-subtle">
        {route.scan_count} {route.scan_count === 1 ? "scan" : "scans"} · Created{" "}
        {formatDate(route.created_at)}
      </p>
      {route.batch_key ? (
        <Link
          href={`/dashboard/routes/batches/${route.batch_key}`}
          className="mt-2 inline-flex text-xs font-medium text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Batch {route.batch_key} · card {route.batch_position}
        </Link>
      ) : null}

      <div className="mt-auto grid grid-cols-2 gap-2 pt-5 sm:grid-cols-4">
        <CopyButton value={publicUrl} className="text-sm" />
        <Link
          href={`/dashboard/routes/${route.id}`}
          className={buttonClass("secondary", "text-sm")}
        >
          View QR
        </Link>
        <Link
          href={`/dashboard/routes/${route.id}/edit`}
          className={buttonClass("secondary", "text-sm")}
        >
          Edit
        </Link>
        <ToggleActiveButton
          id={route.id}
          active={route.active}
          businessName={route.business_name}
        />
      </div>
    </Card>
  );
}

/**
 * The mobile tile is intentionally information-light: it keeps two routes
 * visible at once while making Edit the shortest path for the common workflow.
 * Desktop retains the full card and all route-management actions.
 */
export function RouteCard({ route }: { route: RedirectRoute }) {
  return (
    <>
      <div className="sm:hidden">
        <CompactRouteCard route={route} />
      </div>
      <div className="hidden h-full sm:block">
        <FullRouteCard route={route} />
      </div>
    </>
  );
}
