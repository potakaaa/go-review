"use client";

import { useEffect } from "react";

import { Alert, Button } from "@/components/ui";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Alert tone="danger" title="Something went wrong">
        We couldn&apos;t load this page. Your routes are unaffected — the links
        already printed on cards keep working.
      </Alert>
      <Button type="button" onClick={reset} className="w-full">
        Try again
      </Button>
    </div>
  );
}
