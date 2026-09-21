"use client";

import { Alert, Button } from "@/components/ui";

export default function DashboardError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Alert tone="danger" title="Something went wrong">
        We couldn&apos;t load this page. Your routes are unaffected — the links
        already printed on cards keep working.
        {/* Production hides the real message; the digest is the only handle on
            the server log entry, so show it rather than make it unreportable. */}
        {error.digest && (
          <span className="mt-2 block font-mono text-xs opacity-80">
            Reference: {error.digest}
          </span>
        )}
      </Alert>
      <Button type="button" onClick={reset} className="w-full">
        Try again
      </Button>
    </div>
  );
}
