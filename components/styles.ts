/**
 * Class strings shared by server and client components.
 *
 * These live outside `public-site.tsx` so a server page can use them without
 * importing across the client boundary.
 */

export const container =
  "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";

/** Ink on white. The action colour is a solid object, not a hole in the page. */
export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[0.9375rem] font-medium text-canvas transition-colors duration-200 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink";

export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-canvas px-5 text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink";

/** A quiet text link that still reads as an action. */
export const textButton =
  "inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";
