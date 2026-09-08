"use client";

import { useActionState, useCallback, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  batchUpdateRoutes,
  type RouteFormState,
} from "@/app/(dashboard)/dashboard/routes/actions";
import { GoogleReviewConverter } from "@/components/google-review-converter";
import { RouteDestinationField } from "@/components/route-destination-field";
import { Alert, FormError, buttonClass } from "@/components/ui";
import {
  BATCH_EDIT_MAX_SIZE,
  incrementedRouteNames,
} from "@/lib/batch-edit";
import { destinationNeedsAcknowledgement } from "@/lib/validation";

import { RouteSelectionList } from "@/app/(dashboard)/dashboard/routes/batch/edit/route-selection-list";
import type { BatchEditRoute } from "@/app/(dashboard)/dashboard/routes/batch/edit/types";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={buttonClass("primary", "w-full")}
    >
      {pending ? "Updating routes…" : "Update selected routes"}
    </button>
  );
}

export function BatchEditRoutesForm({ routes }: { routes: BatchEditRoute[] }) {
  const [state, formAction] = useActionState<RouteFormState, FormData>(
    batchUpdateRoutes,
    {},
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [nameSeed, setNameSeed] = useState("");
  const [destination, setDestination] = useState("");

  const editableRoutes = routes.filter((route) => !route.locked);
  const selectedRoutes = routes.filter((route) => selectedIds.has(route.id));
  const generatedNames = incrementedRouteNames(
    nameSeed,
    selectedRoutes.length,
  );
  const previewNameById: Record<string, string> = {};
  selectedRoutes.forEach((route, index) => {
    previewNameById[route.id] = generatedNames[index] ?? "";
  });

  const handleConvertedReviewUrl = useCallback((reviewUrl: string) => {
    setDestination(reviewUrl);
  }, []);

  const toggleRoute = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allEditableSelected =
    editableRoutes.length > 0 &&
    editableRoutes.every((route) => selectedIds.has(route.id));

  const toggleAllRoutes = () => {
    setSelectedIds(
      allEditableSelected
        ? new Set()
        : new Set(editableRoutes.map((route) => route.id)),
    );
  };

  const showWarning = destinationNeedsAcknowledgement(destination);
  const selectionLimitExceeded = selectedRoutes.length > BATCH_EDIT_MAX_SIZE;

  return (
    <form action={formAction} className="space-y-7">
      {state.message ? <Alert tone="danger">{state.message}</Alert> : null}

      <div>
        <label htmlFor="name_seed" className="eyebrow mb-2 block">
          Name pattern
        </label>
        <input
          id="name_seed"
          name="name_seed"
          type="text"
          required
          autoComplete="off"
          autoCapitalize="words"
          value={nameSeed}
          onChange={(event) => setNameSeed(event.target.value)}
          placeholder="restaurant-1"
          className={FIELD}
        />
        <p className="mt-1.5 text-xs leading-5 text-subtle">
          Use <span className="font-mono text-muted">restaurant-1</span> or
          just <span className="font-mono text-muted">restaurant</span>. The
          selected routes will be named restaurant-1, restaurant-2, and so on
          in the alphabetical order below.
        </p>
        <FormError>{state.errors?.name_seed}</FormError>
      </div>

      <GoogleReviewConverter
        embedded
        onConverted={handleConvertedReviewUrl}
        sourceError={state.errors?.maps_url}
      />

      <RouteDestinationField
        value={destination}
        onChange={setDestination}
        error={state.errors?.destination_url}
        description="This destination will be applied to every selected route."
      />

      <RouteSelectionList
        routes={routes}
        selectedIds={selectedIds}
        previewNameById={previewNameById}
        error={state.errors?.route_ids}
        onToggle={toggleRoute}
        onToggleAll={toggleAllRoutes}
        allEditableSelected={allEditableSelected}
      />

      <p aria-live="polite" className="text-xs text-subtle">
        {selectionLimitExceeded
          ? `Select ${BATCH_EDIT_MAX_SIZE} routes or fewer at a time.`
          : selectedRoutes.length === 0
          ? "Select at least one unlocked route to continue."
          : `${selectedRoutes.length} ${selectedRoutes.length === 1 ? "route" : "routes"} will be updated.`}
      </p>

      <div className="mobile-submit-bar">
        <SubmitButton
          disabled={
            selectedRoutes.length === 0 ||
            selectionLimitExceeded ||
            showWarning
          }
        />
      </div>
    </form>
  );
}
