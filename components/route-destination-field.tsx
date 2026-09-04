"use client";

import { Alert, FormError } from "@/components/ui";
import { destinationNeedsAcknowledgement } from "@/lib/validation";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

export function RouteDestinationField({
  value,
  onChange,
  error,
  acknowledgedWarning,
  onAcknowledgedWarningChange,
  description,
  acknowledgementLabel = "Save this destination anyway",
  warningDescription =
    "It will still work — the card will send people wherever this points.",
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  acknowledgedWarning: boolean;
  onAcknowledgedWarningChange: (checked: boolean) => void;
  description: string;
  acknowledgementLabel?: string;
  warningDescription?: string;
}) {
  const showWarning = destinationNeedsAcknowledgement(value);

  return (
    <div>
      <label htmlFor="destination_url" className="eyebrow mb-2 block">
        Review destination URL
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
        placeholder="https://g.page/r/…/review"
        className={FIELD}
      />
      <p className="mt-1.5 text-xs text-subtle">{description}</p>
      <FormError>{error}</FormError>

      {showWarning ? (
        <div className="mt-2">
          <Alert tone="warn" title="This doesn't look like a Google Review link">
            <p>{warningDescription}</p>
            <label className="mt-2 flex items-start gap-2 font-medium">
              <input
                type="checkbox"
                checked={acknowledgedWarning}
                onChange={(event) =>
                  onAcknowledgedWarningChange(event.target.checked)
                }
                className="mt-0.5 size-4"
              />
              {acknowledgementLabel}
            </label>
          </Alert>
        </div>
      ) : null}
    </div>
  );
}
