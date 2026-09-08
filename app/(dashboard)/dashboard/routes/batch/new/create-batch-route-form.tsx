"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createBatch,
  type RouteFormState,
} from "@/app/(dashboard)/dashboard/routes/actions";
import { GoogleReviewConverter } from "@/components/google-review-converter";
import { RouteDestinationField } from "@/components/route-destination-field";
import { Alert, FormError, buttonClass } from "@/components/ui";
import { BATCH_MAX_SIZE, BATCH_MIN_SIZE } from "@/lib/batch";
import { destinationNeedsAcknowledgement } from "@/lib/validation";

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
      {pending ? "Creating batch…" : "Create batch"}
    </button>
  );
}

export function CreateBatchRouteForm() {
  const [state, formAction] = useActionState<RouteFormState, FormData>(
    createBatch,
    {},
  );
  const [destination, setDestination] = useState(
    state.values?.destination_url ?? "",
  );

  const handleConvertedReviewUrl = useCallback((reviewUrl: string) => {
    setDestination(reviewUrl);
  }, []);

  const showWarning = destinationNeedsAcknowledgement(destination);

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      <GoogleReviewConverter
        embedded
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
          enterKeyHint="next"
          defaultValue={state.values?.business_name}
          placeholder="Bella's Cafe"
          className={FIELD}
        />
        <FormError>{state.errors?.business_name}</FormError>
      </div>

      <div>
        <label htmlFor="quantity" className="eyebrow mb-2 block">
          Number of routes
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          required
          min={BATCH_MIN_SIZE}
          max={BATCH_MAX_SIZE}
          step={1}
          inputMode="numeric"
          defaultValue={state.values?.quantity ?? "10"}
          className={FIELD + " font-mono"}
        />
        <p className="mt-1.5 text-xs text-subtle">
          Between {BATCH_MIN_SIZE} and {BATCH_MAX_SIZE}. Routes will be numbered
          like <span className="font-mono">akfiuex-1</span>,{" "}
          <span className="font-mono">akfiuex-2</span> and so on.
        </p>
        <FormError>{state.errors?.quantity}</FormError>
      </div>

      <RouteDestinationField
        value={destination}
        onChange={setDestination}
        error={state.errors?.destination_url}
        description="Filled automatically after conversion. This destination is shared by every route in the batch."
      />

      <div>
        <label htmlFor="notes" className="eyebrow mb-2 block">
          Notes <span className="font-normal text-subtle">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={state.values?.notes}
          placeholder="Table tents, 30 cards, spoke to the manager"
          className={FIELD + " resize-y"}
        />
        <FormError>{state.errors?.notes}</FormError>
      </div>

      <div className="mobile-submit-bar">
        <SubmitButton disabled={showWarning} />
      </div>
    </form>
  );
}
