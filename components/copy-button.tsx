"use client";

import { useEffect, useRef, useState } from "react";

import { buttonClass, type ButtonVariant } from "@/components/ui";

/**
 * Copies text and confirms it visibly for two seconds.
 *
 * The confirmation is not decorative: this button is used while standing in
 * front of a customer, and a silent copy leaves you tapping it repeatedly with
 * no idea whether it worked.
 */
async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path below.
  }

  // navigator.clipboard is unavailable over plain http, which includes testing
  // the dev server from a phone on the same LAN.
  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

function CopyIcon({ copied }: { copied: boolean }) {
  return copied ? (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
    </svg>
  );
}

export function CopyButton({
  value,
  label = "Copy URL",
  copiedLabel = "Copied",
  variant = "secondary",
  className = "",
  iconOnly = false,
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
  variant?: ButtonVariant;
  className?: string;
  /**
   * Renders the icon alone, for sitting beside a URL that is already on
   * screen. `label` still names the button for screen readers and on hover.
   */
  iconOnly?: boolean;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  async function handleClick() {
    const ok = await copyText(value);
    setState(ok ? "copied" : "failed");
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setState("idle"), 2000);
  }

  const announcement =
    state === "copied"
      ? "Copied to clipboard"
      : state === "failed"
        ? "Copy failed"
        : "";

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        title={state === "copied" ? copiedLabel : label}
        aria-label={label}
        className={buttonClass(
          variant,
          `size-9 min-h-9 shrink-0 px-0 ${
            state === "failed" ? "text-danger" : ""
          } ${className}`.trim(),
        )}
      >
        <span aria-hidden="true">
          <CopyIcon copied={state === "copied"} />
        </span>
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonClass(variant, className)}
    >
      <span aria-hidden="true">
        <CopyIcon copied={state === "copied"} />
      </span>
      {state === "copied" ? copiedLabel : state === "failed" ? "Copy failed" : label}
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </button>
  );
}
