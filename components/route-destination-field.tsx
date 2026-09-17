"use client";

import { Alert, FormError } from "@/components/ui";
import { destinationNeedsAcknowledgement } from "@/lib/validation-client";
import { PLATFORM_DETAILS, type RoutePlatform } from "@/lib/platforms";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

export function RouteDestinationField({
  value,
  onChange,
  error,
  description,
  platform,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  description: string;
  platform: RoutePlatform;
}) {
  const showWarning = destinationNeedsAcknowledgement(value, platform);
  const details = PLATFORM_DETAILS[platform];

  return (
    <div>
      <label htmlFor="destination_url" className="eyebrow mb-2 block">
        {details.destinationLabel}
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={details.placeholder}
        className={FIELD}
      />
      <p className="mt-1.5 text-xs text-subtle">{description}</p>
      <FormError>{error}</FormError>

      {showWarning ? (
        <div className="mt-2">
          <Alert tone="warn" title={`${details.shortLabel} link required`}>
            Paste an approved {details.shortLabel} destination. Links for a
            different platform cannot be saved to this card.
          </Alert>
        </div>
      ) : null}
    </div>
  );
}
