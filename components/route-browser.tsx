"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { RouteCard } from "@/components/route-card";
import { ButtonLink, Card, EmptyState, buttonClass } from "@/components/ui";
import {
  filterRoutes,
  filtersToSearch,
  isFiltered,
  parseFilters,
  type RouteFilters,
  type RouteListItem,
} from "@/lib/route-list";

/** Cards drawn per step. Enough to fill a tall phone several times over. */
const STEP = 50;

function SelectChevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * Search, filters and sort over every route the staff member can see, all in
 * the browser.
 *
 * The server sends the whole (trimmed) route list once; each keystroke then
 * filters it in memory, so results appear as fast as the phone can draw them
 * -- no debounce, no round trip. The filter state still lives in the URL (via
 * `history.replaceState`, which updates the address without a navigation), so
 * a filtered list survives a refresh and can be shared as a link.
 *
 * Only the first 50 matches are drawn; more are added as the list scrolls
 * near its end. A phone never lays out a thousand cards at once.
 */
export function RouteBrowser({
  routes,
  canManage,
}: {
  routes: readonly RouteListItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<RouteFilters>(() =>
    parseFilters({
      q: searchParams.get("q"),
      status: searchParams.get("status"),
      sort: searchParams.get("sort"),
      platform: searchParams.get("platform"),
    }),
  );

  // Typing stays responsive even mid-filter on a slow phone: React draws the
  // keystroke first, then the list.
  const shown = useDeferredValue(filters);
  const results = useMemo(() => filterRoutes(routes, shown), [routes, shown]);

  // Back to the first step whenever the filters change -- adjusted during
  // render, so the new results never paint at the old length.
  const [limit, setLimit] = useState(STEP);
  const [limitFor, setLimitFor] = useState(shown);
  if (limitFor !== shown) {
    setLimitFor(shown);
    setLimit(STEP);
  }

  // Mirror the filters into the address bar, skipping the first render so
  // landing on the page never rewrites the URL it arrived with.
  const syncedOnce = useRef(false);
  useEffect(() => {
    if (!syncedOnce.current) {
      syncedOnce.current = true;
      return;
    }
    const search = filtersToSearch(filters);
    window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
  }, [filters, pathname]);

  // The first route page opened in a session would otherwise wait on its
  // client code after the skeleton appears. Fully prefetching one route's
  // pages while the phone is idle loads that code (shared by every route),
  // so whichever card is tapped first opens as fast as the rest.
  const warmId = routes[0]?.id;
  useEffect(() => {
    if (!warmId) return;
    const warm = () => {
      router.prefetch(`/dashboard/routes/${warmId}`);
      if (canManage) router.prefetch(`/dashboard/routes/${warmId}/edit`);
    };
    if (typeof window.requestIdleCallback !== "function") {
      const timer = setTimeout(warm, 1500);
      return () => clearTimeout(timer);
    }
    const handle = window.requestIdleCallback(warm, { timeout: 3000 });
    return () => window.cancelIdleCallback(handle);
  }, [warmId, canManage, router]);

  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = results.length > limit;
  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setLimit((current) => current + STEP);
        }
      },
      // Start drawing well before the end comes into view.
      { rootMargin: "1200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, limit]);

  function update(change: Partial<RouteFilters>) {
    setFilters((current) => ({ ...current, ...change }));
  }

  const stale = shown !== filters;
  const select =
    "route-filter-select min-h-11 w-full min-w-0 appearance-none rounded-md border border-line-strong bg-elevated px-3 py-2 pr-11 text-sm leading-tight font-medium text-ink";

  return (
    <>
      <Card className="p-3 sm:p-5">
        <p className="eyebrow mb-3 sm:mb-4">Find a route</p>
        <div className="space-y-3">
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-subtle"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
            </svg>
            <input
              type="search"
              value={filters.q}
              onChange={(event) => update({ q: event.target.value })}
              onKeyDown={(event) => {
                // Results are already on screen; Enter just closes the keyboard.
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              placeholder="Search route number or business"
              aria-label="Search routes by business name or slug"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="w-full rounded-md border border-line-strong bg-elevated py-3 pr-12 pl-11 text-base [&::-webkit-search-cancel-button]:appearance-none text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-ink"
            />
            {filters.q ? (
              <button
                type="button"
                aria-label="Clear route search"
                onClick={() => update({ q: "" })}
                className="tap-target absolute top-1/2 right-1 flex -translate-y-1/2 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                >
                  <path d="m7 7 10 10M17 7 7 17" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="relative min-w-0">
              <select
                value={filters.platform}
                aria-label="Filter by platform"
                onChange={(event) =>
                  update({ platform: event.target.value as RouteFilters["platform"] })
                }
                className={select}
              >
                <option value="all">All platforms</option>
                <option value="google">Google</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
              </select>
              <SelectChevron />
            </div>

            <div className="relative min-w-0">
              <select
                value={filters.status}
                aria-label="Filter by status"
                onChange={(event) =>
                  update({ status: event.target.value as RouteFilters["status"] })
                }
                className={select}
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
              <SelectChevron />
            </div>

            <div className="relative min-w-0">
              <select
                value={filters.sort}
                aria-label="Sort routes"
                onChange={(event) =>
                  update({ sort: event.target.value as RouteFilters["sort"] })
                }
                className={select}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="most-used">Most used</option>
              </select>
              <SelectChevron />
            </div>

            <span
              aria-live="polite"
              className="col-span-2 flex items-center justify-end text-xs text-subtle tabular-nums sm:ml-auto"
            >
              {results.length.toLocaleString("en-US")}{" "}
              {results.length === 1 ? "route" : "routes"}
            </span>
          </div>
        </div>
      </Card>

      {results.length === 0 ? (
        isFiltered(shown) ? (
          <EmptyState
            title="No matching routes"
            description="Try a different search term, or clear the status filter."
          />
        ) : (
          <EmptyState
            title="No routes yet"
            description="Create your first route to generate a QR code for a card."
            action={
              canManage ? (
                <ButtonLink href="/dashboard/routes/new">Create Route</ButtonLink>
              ) : undefined
            }
          />
        )
      ) : (
        <div
          className={`transition-opacity duration-150 ${stale ? "opacity-70" : ""}`}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-3 lg:grid-cols-2">
            {results.slice(0, limit).map((route) => (
              <RouteCard key={route.id} route={route} canManage={canManage} />
            ))}
          </div>

          {hasMore ? (
            <div ref={sentinel} className="mt-6 flex flex-col items-center gap-3">
              <p className="text-xs text-subtle tabular-nums">
                Showing {limit.toLocaleString("en-US")} of{" "}
                {results.length.toLocaleString("en-US")}
              </p>
              {/* Scrolling loads more by itself; the button is the fallback
                  for keyboards and assistive technology. */}
              <button
                type="button"
                onClick={() => setLimit((current) => current + STEP)}
                className={buttonClass("secondary", "text-sm")}
              >
                Show more routes
              </button>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
