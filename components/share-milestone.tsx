"use client";

import { useRef, useState } from "react";

import { buttonClass } from "@/components/ui";

const IMAGE_PATH = "/dashboard/analytics/share-image";

/**
 * Share control for the analytics milestone card.
 *
 * The PNG is rendered per request from live numbers, so the image is only
 * requested once the dialog is opened -- a preview nobody asked for would put
 * a database read and a Satori render on every visit to the page.
 */
export function ShareMilestone({
  fileName,
  summary,
}: {
  fileName: string;
  summary: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [requested, setRequested] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  function open() {
    // Reopening re-requests the PNG, so the numbers are never stale -- which
    // also means the preview starts from its loading state again.
    setState("loading");
    setRequested(true);
    dialog.current?.showModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label="Share this milestone"
        title="Share this milestone"
        className={buttonClass("secondary", "tap-target")}
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <path d="M12 3 7.4 7.6l1.4 1.4L11 6.8V16h2V6.8l2.2 2.2 1.4-1.4L12 3zM5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5h-2v5H7v-5H5z" />
        </svg>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="share-milestone-title"
        onClose={() => setRequested(false)}
        // A click landing on the dialog itself -- not on the padded card
        // inside it -- is a click on the backdrop.
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="share-dialog m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-surface p-0 text-ink"
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="share-milestone-title"
                className="display-heading text-lg text-ink"
              >
                Share this milestone
              </h2>
              <p className="mt-1 text-xs text-subtle">1080 × 1920 · PNG</p>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className={buttonClass("ghost", "tap-target")}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="m12 10.6 5-5L18.4 7l-5 5 5 5-1.4 1.4-5-5-5 5L5.6 17l5-5-5-5L7 5.6l5 5z" />
              </svg>
            </button>
          </div>

          <div className="mx-auto w-full max-w-[15rem] overflow-hidden rounded-xl border border-line bg-canvas">
            <div className="relative aspect-[9/16] w-full">
              {requested ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- a
                      per-request PNG behind an auth check; next/image would
                      cache private numbers on a CDN and has nothing to
                      optimise here. */}
                  <img
                    src={IMAGE_PATH}
                    alt={summary}
                    width={1080}
                    height={1920}
                    onLoad={() => setState("ready")}
                    onError={() => setState("failed")}
                    className={`absolute inset-0 size-full transition-opacity duration-300 ease-[var(--ease-settle)] ${
                      state === "ready" ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {state === "loading" ? (
                    <div className="absolute inset-0 animate-pulse bg-elevated" />
                  ) : null}
                  {state === "failed" ? (
                    <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-danger">
                      Could not build the image.
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          <p className="text-sm leading-6 text-muted">{summary}</p>

          <a
            href={IMAGE_PATH}
            download={fileName}
            className={buttonClass("primary", "w-full")}
          >
            Download image
          </a>
        </div>
      </dialog>
    </>
  );
}
