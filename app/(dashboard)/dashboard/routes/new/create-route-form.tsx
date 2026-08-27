"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createRoute,
  type RouteFormState,
} from "@/app/(dashboard)/dashboard/routes/actions";
import { GoogleReviewConverter } from "@/components/google-review-converter";
import { Alert, FormError, buttonClass } from "@/components/ui";
import { looksLikeGoogleReviewUrl } from "@/lib/validation";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

function SubmitButton({
  label,
  disabled,
}: {
  label: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={buttonClass("primary", "w-full")}
    >
      {pending ? "Creating…" : label}
    </button>
  );
}

export function CreateRouteForm() {
  const [state, formAction] = useActionState<RouteFormState, FormData>(
    createRoute,
    {},
  );

  const [destination, setDestination] = useState(
    state.values?.destination_url ?? "",
  );
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);
  const [showSlugField, setShowSlugField] = useState(
    Boolean(state.values?.slug),
  );

  const handleConvertedReviewUrl = useCallback((reviewUrl: string) => {
    setDestination(reviewUrl);
    setAcknowledgedWarning(false);
  }, []);

  // Advisory only. A destination that doesn't match a known Google Review shape
  // is still saveable -- Google changes these URLs, and a card that can't be
  // created is worse than one pointing somewhere unexpected.
  const trimmed = destination.trim();
  const showWarning =
    trimmed.length > 0 &&
    trimmed.startsWith("https://") &&
    !looksLikeGoogleReviewUrl(trimmed);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      <div>
        <label htmlFor="business_name" className="eyebrow mb-2 block">
          Business name
        </label>
        <input
          id="business_name"
          name="business_name"
          type="text"
          required
          autoComplete="organization"
          autoCapitalize="words"
          enterKeyHint="next"
          defaultValue={state.values?.business_name}
          placeholder="Bella's Cafe"
          className={FIELD}
        />
        <FormError>{state.errors?.business_name}</FormError>
      </div>

      <GoogleReviewConverter
        embedded
        onConverted={handleConvertedReviewUrl}
        sourceError={state.errors?.maps_url}
      />

      <div>
        <label htmlFor="destination_url" className="eyebrow mb-2 block">
          Google Review URL
        </label>
        <input
          id="destination_url"
          name="destination_url"
          type="url"
          required
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          value={destination}
          onChange={(event) => {
            setDestination(event.target.value);
            setAcknowledgedWarning(false);
          }}
          placeholder="https://g.page/r/…/review"
          className={FIELD}
        />
        <FormError>{state.errors?.destination_url}</FormError>

        {showWarning ? (
          <div className="mt-2">
            <Alert tone="warn" title="This doesn't look like a Google Review link">
              <p>
                It will still work — the card will send people wherever this
                points. Tick below if that&apos;s what you want.
              </p>
              <label className="mt-2 flex items-start gap-2 font-medium">
                <input
                  type="checkbox"
                  checked={acknowledgedWarning}
                  onChange={(event) =>
                    setAcknowledgedWarning(event.target.checked)
                  }
                  className="mt-0.5 size-4"
                />
                Save this destination anyway
              </label>
            </Alert>
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="notes" className="eyebrow mb-2 block">
          Notes <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={state.values?.notes}
          placeholder="Table tents, 20 cards, spoke to the manager"
          className={`${FIELD} resize-y`}
        />
        <FormError>{state.errors?.notes}</FormError>
      </div>

      <div>
        {showSlugField ? (
          <>
            <label htmlFor="slug" className="eyebrow mb-2 block">
              Custom slug{" "}
              <span className="font-normal text-subtle">(optional)</span>
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              defaultValue={state.values?.slug}
              placeholder="bella-cafe"
              className={`${FIELD} font-mono`}
            />
            <p className="mt-1.5 text-xs text-subtle">
              Letters, numbers and hyphens. This becomes part of the printed
              link and can never be changed afterwards.
            </p>
            <FormError>{state.errors?.slug}</FormError>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowSlugField(true)}
            className="tap-target inline-flex items-center rounded-md px-2 text-left text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            + Set a custom slug
          </button>
        )}
        {!showSlugField ? (
          <p className="mt-1.5 text-xs text-subtle">
            A short random link like <span className="font-mono">a7K3mP</span>{" "}
            will be generated for you.
          </p>
        ) : null}
      </div>

      <SubmitButton
        disabled={showWarning && !acknowledgedWarning}
        label={
          showWarning && !acknowledgedWarning
            ? "Confirm the destination above"
            : "Create route"
        }
      />
    </form>
  );
}
