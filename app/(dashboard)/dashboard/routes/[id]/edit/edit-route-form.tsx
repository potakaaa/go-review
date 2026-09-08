"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  updateRoute,
  type RouteFormState,
} from "@/app/(dashboard)/dashboard/routes/actions";
import { GoogleReviewConverter } from "@/components/google-review-converter";
import { RouteDestinationField } from "@/components/route-destination-field";
import { Alert, FormError, buttonClass } from "@/components/ui";
import { destinationNeedsAcknowledgement } from "@/lib/validation";
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
  const [confirmation, setConfirmation] = useState("");

  const handleConvertedReviewUrl = useCallback((reviewUrl: string) => {
    setDestination(reviewUrl);
  }, []);

  const showWarning = destinationNeedsAcknowledgement(destination);

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

      <GoogleReviewConverter
        embedded
        autoFocus
        initialUrl={route.maps_url ?? ""}
        onConverted={handleConvertedReviewUrl}
        sourceError={state.errors?.maps_url}
      />

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

      <RouteDestinationField
        value={destination}
        onChange={setDestination}
        error={state.errors?.destination_url}
        description="Filled automatically after conversion. Edit this only when you need to use another destination."
      />

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

      {route.locked ? (
        <div className="rounded-md border border-warn/35 bg-warn-soft p-4">
          <p className="eyebrow text-warn">Editing locked</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Type <span className="font-medium text-ink">{route.business_name}</span>{" "}
            to confirm this edit. The route will stay locked after saving.
          </p>
          <label
            htmlFor="confirm_business_name"
            className="eyebrow mt-4 mb-2 block"
          >
            Current business name
          </label>
          <input
            id="confirm_business_name"
            name="confirm_business_name"
            type="text"
            required
            inputMode="text"
            autoComplete="off"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className={FIELD}
          />
          <FormError>{state.errors?.confirm_business_name}</FormError>
        </div>
      ) : null}

      <div className="mobile-submit-bar">
        <SubmitButton disabled={showWarning} />
      </div>
    </form>
  );
}
