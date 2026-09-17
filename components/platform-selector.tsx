"use client";

import { PLATFORM_DETAILS, ROUTE_PLATFORMS, type RoutePlatform } from "@/lib/platforms";
import { FormError } from "@/components/ui";

export function PlatformSelector({
  value,
  onChange,
  error,
  disabled = false,
}: {
  value: RoutePlatform;
  onChange: (platform: RoutePlatform) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">Card platform</legend>
      <div className="grid grid-cols-3 gap-2">
        {ROUTE_PLATFORMS.map((platform) => {
          const selected = value === platform;
          return (
            <label
              key={platform}
              className={`cursor-pointer rounded-md border px-3 py-3 text-center text-sm font-medium transition-colors ${
                selected
                  ? "border-ink bg-ink text-canvas"
                  : "border-line-strong bg-elevated text-muted hover:border-ink"
              } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="platform"
                value={platform}
                checked={selected}
                onChange={() => onChange(platform)}
                disabled={disabled}
              />
              {PLATFORM_DETAILS[platform].shortLabel}
            </label>
          );
        })}
      </div>
      {disabled ? <input type="hidden" name="platform" value={value} /> : null}
      <p className="mt-2 text-xs text-subtle">
        {disabled
          ? "Fixed because this route is already published."
          : PLATFORM_DETAILS[value].help}
      </p>
      <FormError>{error}</FormError>
    </fieldset>
  );
}
