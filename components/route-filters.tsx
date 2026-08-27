"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

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
 * Search, status filter and sort, all held in the URL.
 *
 * URL state means a filtered list survives a refresh, a back-navigation, and
 * being handed a link -- and it lets the list stay a Server Component, so
 * filtering never ships the full route set to the browser.
 */
export function RouteFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "all";
  const sort = searchParams.get("sort") ?? "newest";

  // Skip the first run so simply landing on the page doesn't push a duplicate
  // history entry.
  const mounted = useRef(false);

  // Held in a ref, not read directly in the effect below: the debounce must be
  // restarted by typing and by nothing else. Depending on `searchParams` would
  // also restart it whenever the status or sort dropdown fires.
  const latest = useRef({ router, pathname, searchParams });
  useEffect(() => {
    latest.current = { router, pathname, searchParams };
  });

  function push(next: URLSearchParams) {
    const search = next.toString();
    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    });
  }

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    // Debounced: typing a cafe name shouldn't fire a query per keystroke.
    const timer = setTimeout(() => {
      const current = latest.current;
      const next = new URLSearchParams(current.searchParams);
      if (query.trim()) next.set("q", query.trim());
      else next.delete("q");

      const search = next.toString();
      startTransition(() => {
        current.router.replace(
          search ? `${current.pathname}?${search}` : current.pathname,
          { scroll: false },
        );
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, startTransition]);

  function setParam(key: string, value: string, fallback: string) {
    const next = new URLSearchParams(searchParams);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    push(next);
  }

  const select =
    "route-filter-select min-h-11 w-full min-w-0 appearance-none rounded-md border border-line-strong bg-elevated px-3 py-2 pr-11 text-sm leading-tight font-medium text-ink";

  return (
    <div className="space-y-3" aria-busy={isPending}>
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
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search business or slug"
          aria-label="Search routes by business name or slug"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-md border border-line-strong bg-elevated py-3 pr-4 pl-11 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-ink"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <div className="relative min-w-0">
          <select
            value={status}
            aria-label="Filter by status"
            onChange={(event) => setParam("status", event.target.value, "all")}
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
            value={sort}
            aria-label="Sort routes"
            onChange={(event) => setParam("sort", event.target.value, "newest")}
            className={select}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
          <SelectChevron />
        </div>

        <span
          aria-live="polite"
          className="col-span-2 flex items-center justify-end text-xs text-subtle tabular-nums sm:ml-auto"
        >
          {isPending ? "…" : `${total} ${total === 1 ? "route" : "routes"}`}
        </span>
      </div>
    </div>
  );
}
