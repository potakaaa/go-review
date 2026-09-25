"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  convertFacebookPageLink,
  convertGoogleMapsLink,
} from "@/app/(dashboard)/dashboard/routes/actions";
import { Alert, FormError, Spinner, buttonClass } from "@/components/ui";
import { PLATFORM_DETAILS, ROUTE_PLATFORMS, type RoutePlatform } from "@/lib/platforms";
import { destinationNeedsAcknowledgement } from "@/lib/validation-client";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

export type SlotValue = {
  platform: RoutePlatform;
  destination_url: string;
  maps_url: string;
  /**
   * Facebook Page link typed into the converter. Unlike `maps_url` this is a
   * client-side convenience only: the column is Google-specific, so the link
   * is never posted.
   */
  facebook_url?: string;
};

/**
 * One QR slot on a standee.
 *
 * Field names are indexed (`slots[0][platform]`) so several slots can live in
 * one form without colliding, which is also why this cannot reuse the
 * single-route destination field or the embedded Maps converter.
 */
export function StandeeSlotFields({
  index,
  value,
  onChange,
  errors,
  onRemove,
}: {
  index: number;
  value: SlotValue;
  onChange: (next: SlotValue) => void;
  errors?: Record<string, string>;
  onRemove?: () => void;
}) {
  const [converting, startConverting] = useTransition();
  const [convertMessage, setConvertMessage] = useState<string | null>(null);

  const details = PLATFORM_DETAILS[value.platform];
  const destinationError = errors?.[`slots.${index}.destination_url`];
  const mapsError = errors?.[`slots.${index}.maps_url`];
  const showWarning = destinationNeedsAcknowledgement(
    value.destination_url,
    value.platform,
  );

  // A failed conversion is about this slot's input, so it stays written under
  // the field; the toast makes sure it is seen even when the field is
  // scrolled off a phone screen.
  function failConversion(message: string) {
    setConvertMessage(message);
    toast.error(message, { description: `QR ${index + 1}` });
  }

  function succeedConversion(reviewUrl: string) {
    setConvertMessage(null);
    onChange({ ...value, destination_url: reviewUrl });
    toast.success("Link converted", {
      description: `QR ${index + 1} destination filled in.`,
    });
  }

  function convertMapsLink() {
    const source = value.maps_url.trim();
    if (!source) {
      failConversion("Paste a Google Maps share link first.");
      return;
    }

    startConverting(async () => {
      const formData = new FormData();
      formData.set("maps_url", source);
      const result = await convertGoogleMapsLink({}, formData);

      if (result.reviewUrl) succeedConversion(result.reviewUrl);
      else failConversion(result.message ?? "Could not convert that link.");
    });
  }

  function convertFacebookLink() {
    const source = (value.facebook_url ?? "").trim();
    if (!source) {
      failConversion("Paste a Facebook Page or share link first.");
      return;
    }

    startConverting(async () => {
      const formData = new FormData();
      formData.set("facebook_url", source);
      const result = await convertFacebookPageLink({}, formData);

      if (result.reviewUrl) succeedConversion(result.reviewUrl);
      else failConversion(result.message ?? "Could not convert that link.");
    });
  }

  return (
    <fieldset className="rounded-xl border border-line-strong bg-surface p-4 sm:p-5">
      <legend className="eyebrow px-2">QR {index + 1}</legend>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {details.label} · slot {index + 1} on the stand
        </p>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="tap-target shrink-0 rounded-md px-2 text-xs font-medium text-subtle underline decoration-line-strong underline-offset-4 hover:text-danger hover:decoration-danger"
          >
            Remove
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ROUTE_PLATFORMS.map((platform) => {
          const selected = value.platform === platform;
          return (
            <label
              key={platform}
              className={`cursor-pointer rounded-md border px-3 py-3 text-center text-sm font-medium transition-colors ${
                selected
                  ? "border-ink bg-ink text-canvas"
                  : "border-line-strong bg-elevated text-muted hover:border-ink"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name={`slots[${index}][platform]`}
                value={platform}
                checked={selected}
                onChange={() => {
                  // Switching platform clears the link: a Facebook URL is never
                  // a valid Google destination, and a stale one would only be
                  // rejected on submit.
                  setConvertMessage(null);
                  onChange({
                    platform,
                    destination_url: "",
                    maps_url: "",
                    facebook_url: "",
                  });
                }}
              />
              {PLATFORM_DETAILS[platform].shortLabel}
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-subtle">{details.help}</p>

      {value.platform === "google" ? (
        <div className="mt-4">
          <label
            htmlFor={`slot-${index}-maps-url`}
            className="eyebrow mb-2 block"
          >
            Convert a Google Maps link{" "}
            <span className="font-normal text-subtle">(optional)</span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <input
              id={`slot-${index}-maps-url`}
              name={`slots[${index}][maps_url]`}
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={value.maps_url}
              onChange={(event) =>
                onChange({ ...value, maps_url: event.target.value })
              }
              placeholder="https://maps.app.goo.gl/…"
              className={`${FIELD} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={convertMapsLink}
              disabled={converting}
              className={buttonClass("secondary", "shrink-0")}
            >
              {converting ? <Spinner /> : null}
              {converting ? "Converting…" : "Convert link"}
            </button>
          </div>
          <FormError>{mapsError}</FormError>
          <FormError>{convertMessage}</FormError>
        </div>
      ) : (
        <>
          {/* The column only accepts a Maps link on Google slots, so an empty
              value is posted to keep the slot indexes aligned. */}
          <input type="hidden" name={`slots[${index}][maps_url]`} value="" />

          {value.platform === "facebook" ? (
            <div className="mt-4">
              <label
                htmlFor={`slot-${index}-facebook-url`}
                className="eyebrow mb-2 block"
              >
                Convert a Facebook Page link{" "}
                <span className="font-normal text-subtle">(optional)</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <input
                  id={`slot-${index}-facebook-url`}
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={value.facebook_url ?? ""}
                  onChange={(event) =>
                    onChange({ ...value, facebook_url: event.target.value })
                  }
                  placeholder="https://www.facebook.com/share/…"
                  className={`${FIELD} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={convertFacebookLink}
                  disabled={converting}
                  className={buttonClass("secondary", "shrink-0")}
                >
                  {converting ? <Spinner /> : null}
              {converting ? "Converting…" : "Convert link"}
                </button>
              </div>
              <FormError>{convertMessage}</FormError>
            </div>
          ) : null}
        </>
      )}

      <div className="mt-4">
        <label
          htmlFor={`slot-${index}-destination`}
          className="eyebrow mb-2 block"
        >
          {details.destinationLabel}
        </label>
        <input
          id={`slot-${index}-destination`}
          name={`slots[${index}][destination_url]`}
          type="url"
          required
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={value.destination_url}
          onChange={(event) =>
            onChange({ ...value, destination_url: event.target.value })
          }
          placeholder={details.placeholder}
          className={FIELD}
        />
        <FormError>{destinationError}</FormError>

        {showWarning ? (
          <div className="mt-2">
            <Alert tone="warn" title={`${details.shortLabel} link required`}>
              Paste an approved {details.shortLabel} destination. Links for a
              different platform cannot be saved to this QR.
            </Alert>
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}
