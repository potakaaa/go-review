import type { Metadata } from "next";

import { createStandeeBatch } from "@/app/(dashboard)/dashboard/standees/actions";
import { StandeeForm } from "@/components/standee-form";
import { Card } from "@/components/ui";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Batch standees" };

export default async function NewStandeeBatchPage() {
  await requirePermission("routes", "manage");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">03 — standee run</p>
        <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
          Batch standees
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Print many identical stands at once. Every stand gets its own set of
          links, and the whole run downloads as one ZIP.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <StandeeForm action={createStandeeBatch} mode="batch" />
      </Card>
    </div>
  );
}
