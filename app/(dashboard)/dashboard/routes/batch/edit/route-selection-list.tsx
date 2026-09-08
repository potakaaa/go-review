"use client";

import { FormError, LockBadge, StatusBadge } from "@/components/ui";
import { BATCH_EDIT_MAX_SIZE } from "@/lib/batch-edit";

import type { BatchEditRoute } from "@/app/(dashboard)/dashboard/routes/batch/edit/types";

export function RouteSelectionList({
  routes,
  selectedIds,
  previewNameById,
  error,
  onToggle,
  onToggleAll,
  allEditableSelected,
}: {
  routes: BatchEditRoute[];
  selectedIds: Set<string>;
  previewNameById: Record<string, string>;
  error?: string;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  allEditableSelected: boolean;
}) {
  const editableCount = routes.filter((route) => !route.locked).length;
  const canSelectAll =
    editableCount > 0 && editableCount <= BATCH_EDIT_MAX_SIZE;

  return (
    <fieldset>
      <legend className="eyebrow mb-2 block">Routes to update</legend>
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-medium text-ink">Choose the cards</p>
            <p className="mt-1 text-xs text-subtle">
              Names are assigned from top to bottom in this list. Select up to{" "}
              {BATCH_EDIT_MAX_SIZE} routes at a time.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleAll}
            disabled={!canSelectAll}
            className="tap-target self-start rounded-md px-2 text-left text-xs font-medium text-muted underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50 sm:self-auto"
          >
            {allEditableSelected ? "Clear available" : "Select all available"}
          </button>
        </div>

        <div className="divide-y divide-line">
          {routes.map((route) => {
            const inputId = "batch-edit-route-" + route.id;
            const selected = selectedIds.has(route.id);
            const previewName = previewNameById[route.id];

            return (
              <label
                key={route.id}
                htmlFor={inputId}
                className={
                  route.locked
                    ? "flex min-h-16 cursor-not-allowed gap-3 px-4 py-4 opacity-60 sm:px-5"
                    : "flex min-h-16 cursor-pointer gap-3 px-4 py-4 hover:bg-elevated/60 sm:px-5"
                }
              >
                <input
                  id={inputId}
                  name="route_ids"
                  value={route.id}
                  type="checkbox"
                  checked={selected}
                  disabled={route.locked}
                  onChange={() => onToggle(route.id)}
                  className="mt-0.5 size-5 shrink-0 accent-[var(--color-brand)]"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">
                      {route.business_name}
                    </span>
                    <StatusBadge active={route.active} />
                    {route.locked ? <LockBadge /> : null}
                  </span>
                  <span className="mt-1 block truncate font-mono text-xs text-muted">
                    /r/{route.slug}
                  </span>
                  {selected && previewName ? (
                    <span className="mt-2 flex min-w-0 items-baseline gap-2 text-xs text-brand">
                      <span aria-hidden="true">→</span>
                      <span className="truncate font-medium">
                        {previewName}
                      </span>
                    </span>
                  ) : null}
                  {route.locked ? (
                    <span className="mt-2 block text-xs text-warn">
                      Unlock this route from its edit page first.
                    </span>
                  ) : null}
                </span>

                <span className="shrink-0 self-start pt-0.5 text-xs text-subtle tabular-nums">
                  {route.scan_count}{" "}
                  {route.scan_count === 1 ? "scan" : "scans"}
                </span>
              </label>
            );
          })}
        </div>
      </div>
      <FormError>{error}</FormError>
    </fieldset>
  );
}
