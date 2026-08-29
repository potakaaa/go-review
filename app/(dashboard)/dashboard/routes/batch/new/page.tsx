import type { Metadata } from "next";

import { CreateBatchRouteForm } from "@/app/(dashboard)/dashboard/routes/batch/new/create-batch-route-form";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Batch routes" };

export default function NewBatchRoutePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">03 — print run</p>
        <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
          Batch routes
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Create multiple cards for one business at once. Each route gets a
          numbered slug, ready to download as a ZIP.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <CreateBatchRouteForm />
      </Card>
    </div>
  );
}
