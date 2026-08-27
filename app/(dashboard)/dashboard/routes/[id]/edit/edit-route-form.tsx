"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  updateRoute,
  type RouteFormState,
} from "@/app/(dashboard)/dashboard/routes/actions";
import { GoogleReviewConverter } from "@/components/google-review-converter";
import { Alert, FormError, buttonClass } from "@/components/ui";
import { looksLikeGoogleReviewUrl } from "@/lib/validation";
import type { RedirectRoute } from "@/lib/database.types";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={buttonClass("primary", "w-full")}
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function EditRouteForm({ route }: { route: RedirectRoute }) {
  const [state, formAction] = useActionState<RouteFormState, FormData>(
    updateRoute,
    {},
  );

  const [destination, setDestination] = useState(
    state.values?.destination_url ?? route.destination_url,
  );
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);

  const handleConvertedReviewUrl = useCallback((reviewUrl: string) => {
    setDestination(reviewUrl);
    setAcknowledgedWarning(false);
  }, []);

  const trimmed = destination.trim();
  const showWarning =
    trimmed.length > 0 &&
    trimmed.startsWith("https://") &&
    !looksLikeGoogleReviewUrl(trimmed);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={route.id} />

      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      {/* Read-only, and never read by the server action. The slug is printed on
          a physical card; changing the destination must not change the URL. */}
      <div>
        <span className="eyebrow mb-2 block">Public link</span>
        <p className="rounded-md border border-line-strong bg-canvas px-4 py-3 break-anywhere font-mono text-sm text-muted">
          /r/{route.slug}
        </p>
        <p className="mt-1.5 text-xs text-subtle">
          Fixed for the life of the card. Editing the destination below keeps
          this link and its QR code exactly as printed.
        </p>
      </div>

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
          defaultValue={state.values?.business_name ?? route.business_name}
          className={FIELD}
        />
        <FormError>{state.errors?.business_name}</FormError>
      </div>

      <GoogleReviewConverter
        embedded
        initialUrl={route.maps_url ?? ""}
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
          value={destination}
          onChange={(event) => {
            setDestination(event.target.value);
            setAcknowledgedWarning(false);
          }}
          className={FIELD}
        />
        <FormError>{state.errors?.destination_url}</FormError>

        {showWarning ? (
          <div className="mt-2">
            <Alert tone="warn" title="This doesn't look like a Google Review link">
              <p>
                It will still work — the card will send people wherever this
                points.
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
          defaultValue={state.values?.notes ?? route.notes ?? ""}
          className={`${FIELD} resize-y`}
        />
        <FormError>{state.errors?.notes}</FormError>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-md border border-line-strong px-4 py-3 tap-target">
        <span>
          <span className="block text-sm font-medium text-ink">Route active</span>
          <span className="block text-xs text-subtle">
            Inactive cards show a &ldquo;deactivated&rdquo; page instead of
            redirecting.
          </span>
        </span>
        <input
          type="checkbox"
          name="active"
          defaultChecked={route.active}
          className="size-5 shrink-0 accent-[var(--color-brand)]"
        />
      </label>

      <SubmitButton disabled={showWarning && !acknowledgedWarning} />
    </form>
  );
}
