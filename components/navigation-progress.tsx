"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Long enough for a slow phone connection; a stuck bar is worse than none. */
const GIVE_UP_MS = 12_000;

function isPlainLeftClick(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

/**
 * A thin bar at the top of the screen from the moment an internal link is
 * tapped until the next page is on screen.
 *
 * Most taps land on a prefetched loading skeleton instantly, and the bar never
 * appears (it waits 120ms, see globals.css). It covers the other case -- a
 * link tapped before its prefetch finished on a slow connection -- where the
 * screen would otherwise sit unchanged and the tap would feel ignored.
 *
 * It ends on any URL change, including a redirect to somewhere else, and gives
 * up after 12 seconds if the navigation never completes.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const current = search ? `${pathname}?${search}` : pathname;

  const [pending, setPending] = useState(false);
  // Any URL change ends the bar -- arrival, a redirect elsewhere, or the back
  // button -- adjusted during render rather than in an effect, so the bar is
  // gone in the same paint the new page appears.
  const [shownFor, setShownFor] = useState(current);
  if (shownFor !== current) {
    setShownFor(current);
    setPending(false);
  }

  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function onClick(event: MouseEvent) {
      if (!isPlainLeftClick(event)) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // The ZIP/PNG route handlers answer with an attachment; the page never
      // changes, so there is nothing to wait for.
      if (url.pathname.endsWith("/download")) return;
      const destination = `${url.pathname}${url.search}`;
      // Same page (or only a #fragment change): nothing will load.
      if (destination === currentRef.current) return;

      setPending(true);
      clearTimeout(timer);
      timer = setTimeout(() => setPending(false), GIVE_UP_MS);
    }

    // Capture phase: runs before next/link handles the click.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(timer);
    };
  }, []);

  if (!pending) return null;

  return <div className="nav-progress" role="progressbar" aria-label="Loading page" />;
}
