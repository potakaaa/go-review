"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  convertGoogleMapsLink,
  type GoogleReviewConversionState,
} from "@/app/(dashboard)/dashboard/routes/actions";
import { CopyButton } from "@/components/copy-button";
import { Alert, FormError, buttonClass } from "@/components/ui";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

function ConvertButton({
  embedded,
  action,
}: {
  embedded: boolean;
  action: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      formNoValidate={embedded}
      className={buttonClass("primary", "shrink-0")}
      disabled={pending}
      formAction={embedded ? action : undefined}
    >
      {pending ? "Converting…" : "Convert link"}
    </button>
  );
}

export function GoogleReviewConverter({
  embedded = false,
  onConverted,
  initialUrl = "",
  sourceError,
}: {
  /** When true, render controls for a surrounding Create Route form. */
  embedded?: boolean;
  onConverted?: (reviewUrl: string) => void;
  /** Restores the saved source link when editing an existing route. */
  initialUrl?: string;
  /** Validation feedback from the surrounding route form, if any. */
  sourceError?: string;
}) {
  const [state, formAction] = useActionState<
    GoogleReviewConversionState,
    FormData
  >(convertGoogleMapsLink, {});
  const [mapsUrl, setMapsUrl] = useState(initialUrl);

  const currentInput = mapsUrl.trim();
  const currentResult =
    state.sourceUrl === currentInput &&
    Boolean(state.reviewUrl || state.message)
      ? state
      : undefined;

  useEffect(() => {
    if (state.reviewUrl && state.sourceUrl === currentInput) {
      onConverted?.(state.reviewUrl);
    }
  }, [currentInput, onConverted, state.reviewUrl, state.sourceUrl]);

  const controls = (
    <>
      <div>
        <label
          htmlFor={embedded ? "maps_url_embedded" : "maps_url"}
          className="eyebrow mb-2 block"
        >
          {embedded ? (
            <>
              Convert a Google Maps link{" "}
              <span className="font-normal text-subtle">(optional)</span>
            </>
          ) : (
            "Google Maps share link"
          )}
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <input
            id={embedded ? "maps_url_embedded" : "maps_url"}
            name="maps_url"
            type="url"
            required={!embedded}
            inputMode="url"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={mapsUrl}
            onChange={(event) => setMapsUrl(event.target.value)}
            placeholder="https://maps.app.goo.gl/…"
            className={`${FIELD} min-w-0 flex-1`}
          />
          <ConvertButton embedded={embedded} action={formAction} />
        </div>
        <p className="mt-1.5 text-xs text-subtle">
          Paste the place&apos;s Share link. The converter follows Google&apos;s
          redirect and extracts the place ID; no Places API key is needed.
        </p>
        <FormError>{sourceError}</FormError>
      </div>

      {currentResult?.message ? (
        <Alert tone="danger">{currentResult.message}</Alert>
      ) : null}

      {currentResult?.reviewUrl ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-ok/40 bg-ok-soft p-4"
        >
          <p className="eyebrow text-ok">Direct review link</p>
          <p className="mt-2 break-anywhere font-mono text-xs text-ink">
            {currentResult.reviewUrl}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <CopyButton
              value={currentResult.reviewUrl}
              label="Copy link"
              copiedLabel="Copied"
              variant="secondary"
              className="text-sm"
            />
            <a
              href={currentResult.reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "text-sm")}
            >
              Test review link
            </a>
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) return <div className="space-y-4">{controls}</div>;

  return (
    <form action={formAction} className="space-y-4">
      {controls}
    </form>
  );
}
