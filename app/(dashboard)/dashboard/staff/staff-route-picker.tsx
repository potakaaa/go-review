"use client";

import { useId, useMemo, useState } from "react";

import { buttonClass } from "@/components/ui";
import {
  accessMapFromRows,
  applyAccess,
  createdOnLabel,
  destinationHost,
  duplicateBusinessNames,
  filterRoutes,
  groupRoutes,
  isDuplicateName,
  serializeAccessMap,
  summarizeAccess,
  type RouteAccessChoice,
  type RouteAccessMap,
} from "@/lib/staff-route-picker";
import type {
  StaffAccessPreset,
  StaffRouteAccessRow,
  StaffRouteOption,
} from "@/lib/staff-types";
import type { RouteAccessLevel } from "@/lib/database.types";

/**
 * Route access for one staff member.
 *
 * The inventory grows without bound, so the picker never asks the superadmin to
 * walk it: blanket access covers the common "looks after everything" case, and
 * the explicit list is searchable, grouped by business, collapsed by default,
 * and settable in bulk. Choices are posted as a single hidden field so the
 * payload is proportional to the grants rather than to the inventory.
 */

const CHOICES: Array<{ value: RouteAccessChoice; label: string }> = [
  { value: "none", label: "No access" },
  { value: "view", label: "View only" },
  { value: "manage", label: "Manage" },
];

const SELECT_CLASS =
  "min-h-11 shrink-0 rounded-md border border-line-strong bg-elevated px-3 text-sm text-ink focus:border-ink focus:outline-2 focus:outline-ink";

export function StaffRouteAccessPicker({
  routes,
  access,
  allRoutesAccess,
  presets = [],
}: {
  routes: StaffRouteOption[];
  access?: StaffRouteAccessRow[];
  allRoutesAccess?: RouteAccessLevel | null;
  presets?: StaffAccessPreset[];
}) {
  const fieldId = useId();
  const [blanket, setBlanket] = useState<RouteAccessLevel | null>(
    allRoutesAccess ?? null,
  );
  const [blanketLevel, setBlanketLevel] = useState<RouteAccessLevel>(
    allRoutesAccess ?? "manage",
  );
  const [map, setMap] = useState<RouteAccessMap>(() => accessMapFromRows(access));
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(new Set());
  const [listOpen, setListOpen] = useState(() => (access?.length ?? 0) === 0);
  const [presetId, setPresetId] = useState("");

  const duplicated = useMemo(() => duplicateBusinessNames(routes), [routes]);
  const summary = useMemo(() => summarizeAccess(routes, map), [routes, map]);
  const visible = useMemo(() => filterRoutes(routes, query), [routes, query]);
  const groups = useMemo(() => groupRoutes(visible), [visible]);
  const searching = query.trim().length > 0;

  function setChoice(routeIds: readonly string[], choice: RouteAccessChoice) {
    setMap((current) => applyAccess(current, routeIds, choice));
  }

  function toggleGroup(key: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function applyPreset() {
    const preset = presets.find((item) => item.user_id === presetId);
    if (!preset) return;
    if (preset.all_routes_access) {
      setBlanket(preset.all_routes_access);
      setBlanketLevel(preset.all_routes_access);
      return;
    }
    setBlanket(null);
    setMap(accessMapFromRows(preset.access));
    setListOpen(true);
  }

  if (routes.length === 0) {
    return (
      <div className="space-y-3">
        <input type="hidden" name="all_routes_access" value={blanket ?? ""} />
        <input type="hidden" name="route_access_json" value="[]" />
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-5 text-sm text-muted">
          No routes exist yet. Route access can be assigned later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="all_routes_access" value={blanket ?? ""} />
      <input
        type="hidden"
        name="route_access_json"
        value={serializeAccessMap(blanket ? {} : map)}
      />

      <fieldset className="space-y-2">
        <legend className="sr-only">How much of the route inventory</legend>

        <label className="flex flex-col gap-3 rounded-xl border border-line bg-canvas px-4 py-3 transition-[background-color,transform] duration-150 ease-out hover:bg-elevated/50 active:scale-[0.995] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex min-w-0 items-start gap-3">
            <input
              type="radio"
              name={`${fieldId}-scope`}
              checked={blanket !== null}
              onChange={() => setBlanket(blanketLevel)}
              className="mt-0.5 size-4 shrink-0 accent-brand"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">All routes</span>
              <span className="mt-1 block text-xs leading-5 text-subtle">
                Includes routes created later, so a new route needs no revisit here.
              </span>
            </span>
          </span>
          <select
            aria-label="Access level for all routes"
            value={blanketLevel}
            disabled={blanket === null}
            onChange={(event) => {
              const level = event.target.value as RouteAccessLevel;
              setBlanketLevel(level);
              setBlanket(level);
            }}
            className={`${SELECT_CLASS} disabled:opacity-40`}
          >
            <option value="view">View only</option>
            <option value="manage">Manage</option>
          </select>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-line bg-canvas px-4 py-3 transition-[background-color,transform] duration-150 ease-out hover:bg-elevated/50 active:scale-[0.995]">
          <input
            type="radio"
            name={`${fieldId}-scope`}
            checked={blanket === null}
            onChange={() => setBlanket(null)}
            className="mt-0.5 size-4 shrink-0 accent-brand"
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">
              Only the routes picked below
            </span>
            <span className="mt-1 block text-xs leading-5 text-subtle">
              {summary.granted === 0
                ? "Nothing selected yet."
                : `${summary.granted} of ${summary.total} routes · ${summary.manage} manage · ${summary.view} view-only`}
            </span>
          </span>
        </label>
      </fieldset>

      {blanket !== null ? null : (
        <div className="space-y-3 rounded-xl border border-line bg-canvas p-4">
          {presets.length > 0 ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                htmlFor={`${fieldId}-preset`}
                className="text-xs font-medium text-subtle sm:w-28"
              >
                Start from
              </label>
              <select
                id={`${fieldId}-preset`}
                value={presetId}
                onChange={(event) => setPresetId(event.target.value)}
                className={`${SELECT_CLASS} min-w-0 flex-1`}
              >
                <option value="">Another staff member…</option>
                {presets.map((preset) => (
                  <option key={preset.user_id} value={preset.user_id}>
                    {preset.email ?? preset.user_id}
                    {preset.all_routes_access
                      ? " · all routes"
                      : ` · ${preset.access.length} routes`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={applyPreset}
                disabled={!presetId}
                className={buttonClass("secondary", "text-xs")}
              >
                Copy access
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor={`${fieldId}-search`} className="sr-only">
              Search routes
            </label>
            <input
              id={`${fieldId}-search`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by business or slug"
              className="min-h-11 w-full rounded-md border border-line-strong bg-elevated px-3 text-sm text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-ink"
            />
            <button
              type="button"
              onClick={() => setListOpen((open) => !open)}
              aria-expanded={listOpen}
              className={buttonClass("ghost", "text-xs")}
            >
              {listOpen ? "Hide routes" : `Show ${routes.length} routes`}
            </button>
          </div>

          {listOpen ? (
            <div className="max-h-[28rem] space-y-2 overflow-y-auto overscroll-contain px-1 pb-1">
              <div className="glass sticky top-0 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2">
                <span className="text-xs text-subtle">
                  Apply to {visible.length}
                  {searching ? " matching" : ""}{" "}
                  {visible.length === 1 ? "route" : "routes"}:
                </span>
                {CHOICES.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() =>
                      setChoice(
                        visible.map((route) => route.id),
                        choice.value,
                      )
                    }
                    className={buttonClass("secondary", "px-3 py-1.5 text-xs")}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>

              {visible.length === 0 ? (
                <p className="px-1 py-4 text-sm text-muted">
                  No route matches “{query.trim()}”.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {groups.map((group) => {
                    const ids = group.routes.map((route) => route.id);
                    const groupSummary = summarizeAccess(group.routes, map);
                    const expanded = searching || openGroups.has(group.key);
                    return (
                      <li
                        key={group.key}
                        className="overflow-hidden rounded-lg border border-line"
                      >
                        <div className="flex items-center gap-2 bg-elevated px-3 py-2">
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.key)}
                            aria-expanded={expanded}
                            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-md text-left tap-target transition-transform duration-150 ease-out active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            <Chevron open={expanded} />
                            <span className="truncate text-sm font-medium text-ink">
                              {group.label}
                            </span>
                            <span className="shrink-0 font-mono text-[11px] tabular-nums text-subtle">
                              {groupSummary.granted}/{group.routes.length}
                            </span>
                          </button>
                          <select
                            aria-label={`Access to every ${group.label} route`}
                            value=""
                            onChange={(event) => {
                              const choice = event.target.value as RouteAccessChoice;
                              if (choice) setChoice(ids, choice);
                              event.target.value = "";
                            }}
                            className={`${SELECT_CLASS} min-h-9 py-1 text-xs`}
                          >
                            <option value="">Set all…</option>
                            {CHOICES.map((choice) => (
                              <option key={choice.value} value={choice.value}>
                                {choice.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {expanded ? (
                          <ul className="disclose divide-y divide-line">
                            {group.routes.map((route) => (
                              <RouteRow
                                key={route.id}
                                route={route}
                                choice={map[route.id] ?? "none"}
                                ambiguous={isDuplicateName(
                                  duplicated,
                                  route.business_name,
                                )}
                                onChange={(choice) => setChoice([route.id], choice)}
                              />
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Rotating disclosure chevron. Drawn rather than typed: a text glyph inherits
 * the font's own metrics and sits off the optical centre of the row.
 */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={`size-3 shrink-0 text-subtle transition-transform duration-200 ease-out ${open ? "rotate-90" : ""}`}
    >
      <path
        d="M6 3.5 10.5 8 6 12.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RouteRow({
  route,
  choice,
  ambiguous,
  onChange,
}: {
  route: StaffRouteOption;
  choice: RouteAccessChoice;
  ambiguous: boolean;
  onChange: (choice: RouteAccessChoice) => void;
}) {
  // Two routes can share a business name, in which case the slug alone is a
  // poor tiebreaker -- the destination and creation day say which is which.
  const host = ambiguous ? destinationHost(route.destination_url) : null;
  const created = ambiguous ? createdOnLabel(route.created_at) : null;

  return (
    <li className="flex items-center justify-between gap-3 px-3 py-2 transition-colors duration-150 ease-out hover:bg-elevated/60">
      <span className="min-w-0">
        <span className="block truncate text-sm text-ink">
          {route.business_name}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[11px] text-subtle">
          /r/{route.slug}
          {route.publication_status === "draft" ? " · draft" : ""}
          {host ? ` · ${host}` : ""}
          {created ? ` · added ${created}` : ""}
        </span>
      </span>
      <select
        aria-label={`Access to ${route.business_name} (/r/${route.slug})`}
        value={choice}
        onChange={(event) => onChange(event.target.value as RouteAccessChoice)}
        className={`${SELECT_CLASS} min-h-9 py-1 text-xs`}
      >
        {CHOICES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </li>
  );
}
