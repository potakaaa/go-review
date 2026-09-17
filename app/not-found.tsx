import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/ui";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="eyebrow">404 — missing route</p>
      <h1 className="text-title mt-3">Page not found</h1>
      <p className="mt-4 max-w-sm text-[0.9375rem] leading-7 text-muted">
        That page doesn&apos;t exist. The link may be outdated, or the address
        may have a typo.
      </p>
      <Link href="/" className={buttonClass("primary", "mt-6")}>
        Go to Goreview
      </Link>
    </main>
  );
}
