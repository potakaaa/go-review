import type { ReactNode } from "react";

import { Card, Spinner } from "@/components/ui";

/**
 * Loading states for `loading.tsx` files. Each page's skeleton mirrors that
 * page's real layout, so nothing jumps when the content arrives, and every one
 * carries a visible "Loading …" label: a staff member should never have to
 * guess whether a tap registered.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/**
 * The page-level wrapper: announces the load to screen readers and shows the
 * same words on screen next to a spinner.
 *
 * The label floats in the top-right corner, which every page header leaves
 * empty (actions sit at the bottom of the header, or below it on a phone), so
 * it takes no space in the layout and the real page lands without a shift.
 */
export function LoadingPage({
  label,
  className = "space-y-8",
  children,
}: {
  /** What is loading, e.g. "Loading routes". */
  label: string;
  /** The page's own outer classes, e.g. `mx-auto max-w-3xl space-y-8`. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`relative ${className}`}
    >
      <p className="absolute top-0 right-0 z-10 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-muted">
        <Spinner className="size-3.5" />
        {label}…
      </p>
      {children}
    </div>
  );
}

/**
 * Eyebrow, display heading and one line of copy, plus optional buttons.
 * `bordered` matches list and detail headers; create pages have no rule.
 */
export function PageHeaderSkeleton({
  actions = 0,
  bordered = true,
  className = "",
}: {
  actions?: number;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${
        bordered ? "border-b border-line pb-8" : ""
      } ${className}`}
    >
      <div className="min-w-0 flex-1 space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-48 max-w-full sm:h-12" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {actions > 0 ? (
        <div className="grid gap-2 sm:flex sm:shrink-0">
          {Array.from({ length: actions }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full sm:w-32" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The eyebrow + heading that opens a section, over its hairline rule. */
export function SectionHeadingSkeleton({ aside = false }: { aside?: boolean }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3 border-b border-line pb-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-44" />
      </div>
      {aside ? <Skeleton className="h-3 w-20" /> : null}
    </div>
  );
}

/** A labelled input: label line plus a field-height block. */
export function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className={tall ? "h-24 w-full" : "h-12 w-full"} />
    </div>
  );
}

/** The three-up Google / Facebook / Instagram choice that opens route forms. */
export function PlatformSelectorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
    </div>
  );
}

/** Form fields and a full-width submit button, without the surrounding card. */
export function FormFieldsSkeleton({
  fields = 3,
  platform = false,
}: {
  fields?: number;
  /** Starts with the platform selector, like every route form. */
  platform?: boolean;
}) {
  return (
    <div className="space-y-6">
      {platform ? <PlatformSelectorSkeleton /> : null}
      {Array.from({ length: fields }, (_, index) => (
        <FieldSkeleton key={index} tall={index === fields - 1 && fields > 2} />
      ))}
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

/** A form card, padded like the create and edit pages' `Card`. */
export function FormSkeleton({
  fields = 3,
  platform = false,
  className = "",
}: {
  fields?: number;
  platform?: boolean;
  className?: string;
}) {
  return (
    <Card className={`p-5 sm:p-7 ${className}`}>
      <FormFieldsSkeleton fields={fields} platform={platform} />
    </Card>
  );
}

/** A grid of card placeholders, matching the list layouts. */
export function CardGridSkeleton({
  count = 6,
  className = "grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3 lg:grid-cols-2",
  cardClassName = "h-44 sm:h-56",
}: {
  count?: number;
  className?: string;
  cardClassName?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className={`flex flex-col gap-3 p-3 sm:p-5 ${cardClassName}`}>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="mt-auto h-9 w-full" />
        </Card>
      ))}
    </div>
  );
}

/** Rows of a list: two lines of text and a trailing badge or button. */
export function ListSkeleton({
  rows = 5,
  trailing = "h-6 w-16",
}: {
  rows?: number;
  /** Size of the trailing block, e.g. a status badge or a small button. */
  trailing?: string;
}) {
  return (
    <Card className="divide-y divide-line overflow-hidden">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className={`shrink-0 ${trailing}`} />
        </div>
      ))}
    </Card>
  );
}

/** Label-over-value rows inside one card, like the route detail facts. */
export function DetailRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="divide-y divide-line">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="space-y-2 px-4 py-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </Card>
  );
}

/** A grid of big-number tiles separated by hairlines. */
export function StatsSkeleton({
  count = 4,
  className = "grid grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  /** Grid columns only; the frame and hairlines are shared. */
  className?: string;
}) {
  return (
    <div
      className={`gap-px overflow-hidden rounded-xl border border-line bg-line ${className}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 bg-surface px-5 py-5 sm:px-6">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** The QR preview square, its link, and the copy/download buttons. */
export function QrPanelSkeleton() {
  return (
    <div>
      <Skeleton className="mx-auto aspect-square w-full max-w-[320px] rounded-2xl" />
      <Skeleton className="mx-auto mt-4 h-3 w-56 max-w-full" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Skeleton className="col-span-2 h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
      </div>
      <Skeleton className="mx-auto mt-4 h-3 w-64 max-w-full" />
    </div>
  );
}

/** The highlighted "Print-ready export" band on batch and run pages. */
export function CalloutSkeleton() {
  return (
    <Card className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-11 w-full shrink-0 sm:w-36" />
    </Card>
  );
}
