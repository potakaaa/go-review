"use client";

import { createContext, use, useOptimistic, type ReactNode } from "react";

import { LockBadge, PublicationBadge, StatusBadge } from "@/components/ui";

/**
 * A route's switchable state, shared by its badges and its buttons, so one tap
 * updates everything on screen at once -- before the server has answered.
 *
 * The optimistic value lives only while the Server Action is in flight. When
 * it succeeds, revalidation delivers the real value (the same one); when it
 * fails, React drops the optimistic value and the badges fall back by
 * themselves.
 */

type RouteSwitches = {
  active: boolean;
  locked: boolean;
  published: boolean;
};

type RouteStateValue = RouteSwitches & {
  /** Call inside a transition or form action (React's useOptimistic rule). */
  apply: (change: Partial<RouteSwitches>) => void;
};

const RouteStateContext = createContext<RouteStateValue | null>(null);

export function RouteStateProvider({
  active,
  locked,
  published,
  children,
}: RouteSwitches & { children: ReactNode }) {
  const [state, apply] = useOptimistic(
    { active, locked, published },
    (current: RouteSwitches, change: Partial<RouteSwitches>) => ({
      ...current,
      ...change,
    }),
  );
  return (
    <RouteStateContext value={{ ...state, apply }}>{children}</RouteStateContext>
  );
}

/**
 * The shared state, or -- outside a provider -- the server values passed in,
 * so a button or badge still works on its own.
 */
export function useRouteState(fallback: Partial<RouteSwitches>): RouteStateValue {
  return (
    use(RouteStateContext) ?? {
      active: fallback.active ?? true,
      locked: fallback.locked ?? false,
      published: fallback.published ?? true,
      apply: () => {},
    }
  );
}

export function RouteStatusBadge({ active }: { active: boolean }) {
  const state = useRouteState({ active });
  return <StatusBadge active={state.active} />;
}

export function RouteLockBadge({
  locked,
  compact = false,
}: {
  locked: boolean;
  compact?: boolean;
}) {
  const state = useRouteState({ locked });
  return state.locked ? <LockBadge compact={compact} /> : null;
}

export function RoutePublicationBadge({
  status,
}: {
  status: "draft" | "published";
}) {
  const state = useRouteState({ published: status === "published" });
  return <PublicationBadge status={state.published ? "published" : "draft"} />;
}

/** "Live link" / "Deactivated", the compact card's one-line status. */
export function RouteLiveLabel({ active }: { active: boolean }) {
  const state = useRouteState({ active });
  return <>{state.active ? "Live link" : "Deactivated"}</>;
}

/** The compact card's small status chip. */
export function RouteMobileStatus({ active: serverActive }: { active: boolean }) {
  const { active } = useRouteState({ active: serverActive });
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
