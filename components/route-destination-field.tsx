"use client";

import { Alert, FormError } from "@/components/ui";
import { destinationNeedsAcknowledgement } from "@/lib/validation";

const FIELD =
  "w-full rounded-md border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

export function RouteDestinationField({
  value,
  onChange,
  error,
  description,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  description: string;
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
          <Alert tone="warn" title="Google Review link required">
            Convert a Google Maps share link above or paste an approved Google
            Maps or Review URL. Other destinations cannot be saved.
          </Alert>
        </div>
      ) : null}
    </div>
  );
}
