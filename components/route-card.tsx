import Link from "next/link";

import { CopyButton } from "@/components/copy-button";
import { ToggleActiveButton } from "@/components/toggle-active-button";
import { Card, StatusBadge, buttonClass } from "@/components/ui";
import { domainOf, formatDate } from "@/lib/format";
import { publicUrlForSlug } from "@/lib/qr";
import type { RedirectRoute } from "@/lib/database.types";

/**
 * One card per route, sized for a phone. A table was explicitly ruled out:
 * a full redirect URL cannot fit in a 390px-wide column without truncation
 * that hides the part you need to read.
 */
export function RouteCard({ route }: { route: RedirectRoute }) {
  const publicUrl = publicUrlForSlug(route.slug);

  return (
    <Card className="p-5 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium tracking-tight">
            {route.business_name}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted">/r/{route.slug}</p>
        </div>
        <StatusBadge active={route.active} />
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
          href={"/dashboard/routes/batches/" + route.batch_key}
          className="mt-2 inline-flex text-xs font-medium text-brand underline decoration-brand/40 underline-offset-4 transition-colors hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Batch {route.batch_key} · card {route.batch_position}
        </Link>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
