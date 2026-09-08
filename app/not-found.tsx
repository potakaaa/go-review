import Link from "next/link";

import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="eyebrow">404 — missing route</p>
      <h1 className="display-heading mt-3 text-3xl text-ink">Page not found</h1>
      <p className="mt-3 text-sm text-muted">
        That page doesn&apos;t exist.
      </p>
      <Link href="/" className={buttonClass("primary", "mt-6")}>
        Go to Goreview
      </Link>
    </main>
  );
}
