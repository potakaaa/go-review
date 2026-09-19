"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { StandeeFormState } from "@/app/(dashboard)/dashboard/standees/actions";
import { StandeeSlotFields, type SlotValue } from "@/components/standee-slot-fields";
import { Alert, FormError, buttonClass } from "@/components/ui";
import {
  maxStandeeBatchSize,
  STANDEE_MAX_SLOTS,
  STANDEE_MIN_SLOTS,
} from "@/lib/standee";
import { isRoutePlatform } from "@/lib/platforms";
import { destinationNeedsAcknowledgement } from "@/lib/validation-client";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

/** Facebook beside Google Maps -- the pairing on the printed stand. */
const DEFAULT_SLOTS: SlotValue[] = [
  { platform: "facebook", destination_url: "", maps_url: "" },
  { platform: "google", destination_url: "", maps_url: "" },
];

function restoreSlots(values: StandeeFormState["values"]): SlotValue[] {
  const saved = values?.slots;
  if (!saved?.length) return DEFAULT_SLOTS;

  return saved
    .slice(0, STANDEE_MAX_SLOTS)
    .map((slot) => ({
      platform: isRoutePlatform(slot.platform) ? slot.platform : "google",
      destination_url: slot.destination_url ?? "",
      maps_url: slot.maps_url ?? "",
    }));
}

function SubmitButton({ label, disabled }: { label: string; disabled?: boolean }) {
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

/**
 * One form for both "a standee" and "a run of standees".
 *
 * The business name and notes are typed once and copied onto every QR, which
 * is what keeps the routes list and analytics readable: each stand shows up as
 * two to four rows under one name.
 */
export function StandeeForm({
  action,
  mode,
}: {
  action: (
    state: StandeeFormState,
    formData: FormData,
  ) => Promise<StandeeFormState>;
  mode: "single" | "batch";
}) {
  const [state, formAction] = useActionState<StandeeFormState, FormData>(
    action,
    {},
  );

  const [slots, setSlots] = useState<SlotValue[]>(() => restoreSlots(state.values));

  const batchLimit = maxStandeeBatchSize(slots.length);
  const blockingLink = slots.some((slot) =>
    destinationNeedsAcknowledgement(slot.destination_url, slot.platform),
  );

  function updateSlot(index: number, next: SlotValue) {
    setSlots((current) =>
      current.map((slot, position) => (position === index ? next : slot)),
    );
  }

  function addSlot() {
    setSlots((current) =>
      current.length >= STANDEE_MAX_SLOTS
        ? current
        : [...current, { platform: "google", destination_url: "", maps_url: "" }],
    );
  }

  function removeSlot(index: number) {
    setSlots((current) =>
      current.length <= STANDEE_MIN_SLOTS
        ? current
        : current.filter((_, position) => position !== index),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      <input type="hidden" name="slot_count" value={slots.length} />

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
        <p className="mt-1.5 text-xs text-subtle">
          Shared by every QR on the stand, so the whole standee reads as one
          business in the routes list.
        </p>
        <FormError>{state.errors?.business_name}</FormError>
      </div>

      {mode === "batch" ? (
        <div>
          <label htmlFor="quantity" className="eyebrow mb-2 block">
            How many standees
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            required
            inputMode="numeric"
            min={2}
            max={batchLimit}
            step={1}
            defaultValue={state.values?.quantity}
            placeholder="10"
            className={FIELD}
          />
          <p className="mt-1.5 text-xs text-subtle">
            Up to {batchLimit} stands with {slots.length} QR codes each. Every
            stand gets its own links; the run downloads as one ZIP.
          </p>
          <FormError>{state.errors?.quantity}</FormError>
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow">
            QR codes on the stand ({slots.length})
          </p>
          {slots.length < STANDEE_MAX_SLOTS ? (
            <button
              type="button"
              onClick={addSlot}
              className="tap-target rounded-md px-2 text-sm font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
            >
              + Add a QR
            </button>
          ) : null}
        </div>

        <FormError>{state.errors?.slots}</FormError>

        {slots.map((slot, index) => (
          <StandeeSlotFields
            key={index}
            index={index}
            value={slot}
            onChange={(next) => updateSlot(index, next)}
            errors={state.errors}
            onRemove={
              slots.length > STANDEE_MIN_SLOTS
                ? () => removeSlot(index)
                : undefined
            }
          />
        ))}
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
          placeholder="Counter standee, spoke to the manager"
          className={`${FIELD} resize-y`}
        />
        <FormError>{state.errors?.notes}</FormError>
      </div>

      <div className="mobile-submit-bar">
        <SubmitButton
          disabled={blockingLink}
          label={
            blockingLink
              ? "Fix the highlighted link"
              : mode === "batch"
                ? "Create standee run"
                : "Create standee"
          }
        />
      </div>
    </form>
  );
}
