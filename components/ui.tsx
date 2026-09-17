import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The handful of primitives every screen shares. Kept as plain className
 * builders rather than a component library -- the whole app is nine screens,
 * and the indirection would cost more than it saves.
 */

const BASE_BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2.5 text-sm leading-none font-medium tap-target whitespace-nowrap transition-[color,background-color,border-color,transform] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const VARIANTS = {
  primary: "bg-brand text-canvas hover:bg-brand-strong active:translate-y-px",
  secondary:
    "border-line-strong bg-transparent text-ink hover:bg-elevated active:translate-y-px",
  ghost: "text-muted hover:bg-elevated hover:text-ink active:translate-y-px",
  danger:
    "border-danger/40 bg-danger-soft text-danger hover:border-danger active:translate-y-px",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export function buttonClass(
  variant: ButtonVariant = "primary",
  extra = "",
): string {
  return `${BASE_BUTTON} ${VARIANTS[variant]} ${extra}`.trim();
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Card({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface ${className}`}
      {...props}
    />
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase ${
        active
          ? "border-ok/30 bg-ok-soft text-ok"
          : "border-line bg-elevated text-subtle"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${active ? "bg-ok" : "bg-subtle"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function PublicationBadge({ status }: { status: "draft" | "published" }) {
  if (status === "published") return null;
  return (
    <span className="inline-flex items-center rounded-full border border-warn/30 bg-warn-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-warn">
      Draft approval needed
    </span>
  );
}

export function LockBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      title="Editing locked"
      aria-label="Editing locked"
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-warn/30 bg-warn-soft text-warn ${
        compact
          ? "size-6 p-0"
          : "px-2.5 py-1 text-[11px] font-medium tracking-wide uppercase"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={compact ? "size-3.5" : "size-3"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 10V8a5 5 0 0 1 10 0v2" />
        <rect x="5" y="10" width="14" height="10" rx="1.5" />
        <path d="M12 14v2" />
      </svg>
      {compact ? null : "Locked"}
    </span>
  );
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function Alert({
  tone,
  title,
  children,
}: {
  tone: "warn" | "danger" | "ok";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    warn: "border-warn/35 bg-warn-soft text-warn",
    danger: "border-danger/35 bg-danger-soft text-danger",
    ok: "border-ok/35 bg-ok-soft text-ok",
  } as const;

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-md border border-l-2 px-4 py-3 text-sm leading-6 ${tones[tone]}`}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed px-6 py-12 text-center">
      <div
        aria-hidden="true"
        className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md border border-line-strong bg-elevated text-ink"
      >
        <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
          <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10-2h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 0v2h-2v-2h2z" />
        </svg>
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Card>
  );
}
