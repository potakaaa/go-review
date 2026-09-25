"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

// Bundled with the app's CSS so it is served from 'self'. Sonner also tries to
// inject the same rules as an inline <style>, which the admin CSP (nonce-only
// style-src) refuses -- harmless, since these rules are already loaded.
import "sonner/dist/styles.css";

/**
 * The one toast outlet for the workspace and its sign-in screens, in the
 * shadcn/ui wrapper shape. Mounted once per layout, never per page, or every
 * toast would render twice.
 *
 * Top-center keeps toasts clear of the thumb-reach bottom nav and above the
 * on-screen keyboard. Rich colours make the outcome readable at a glance:
 * green done, red failed, amber check this, blue for information. The
 * workspace palette supplies the exact shades (see globals.css).
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      richColors
      closeButton
      visibleToasts={3}
      duration={4000}
      offset={{ top: 80 }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      className="toaster"
      {...props}
    />
  );
}
