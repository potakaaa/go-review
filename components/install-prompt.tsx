"use client";

import { useEffect, useState } from "react";

import { buttonClass } from "@/components/ui";

const DISMISS_KEY = "review-routes:install-prompt-dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(
      (navigator as Navigator & { standalone?: boolean }).standalone,
    )
  );
}

function isIphoneSafari() {
  const userAgent = navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/.test(userAgent);
  const isSafari =
    /Safari/.test(userAgent) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);

  return isIos && isSafari;
}

/**
 * iOS does not expose a reliable install prompt event. The useful version of
 * this prompt is therefore a short Safari-specific instruction, hidden once
 * the app is already running in standalone mode.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    // Defer the browser-only decision until after hydration without causing a
    // synchronous state update inside the effect.
    const timer = window.setTimeout(() => {
      if (!isIphoneSafari() || isStandalone()) return;

      try {
        if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
      } catch {
        // Private browsing can deny localStorage; the prompt is still useful.
      }

      setVisible(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // The state still dismisses for this render if storage is unavailable.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      aria-labelledby="install-prompt-title"
      className="mb-6 flex items-start gap-4 rounded-xl border border-line-strong bg-elevated px-4 py-4 sm:px-5"
    >
      <div className="min-w-0 flex-1">
        <p className="eyebrow">Install on iPhone</p>
        <h2 id="install-prompt-title" className="mt-2 text-sm font-semibold">
          Keep Review Routes one tap away
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          In Safari, tap Share, then choose <strong>Add to Home Screen</strong>.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className={buttonClass("ghost", "shrink-0 px-2 text-xs")}
      >
        Dismiss
      </button>
    </aside>
  );
}
