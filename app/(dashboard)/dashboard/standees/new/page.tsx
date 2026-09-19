import type { Metadata } from "next";

import { createStandee } from "@/app/(dashboard)/dashboard/standees/actions";
import { StandeeForm } from "@/components/standee-form";
import { Card } from "@/components/ui";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "New standee" };

export default async function NewStandeePage() {
  await requirePermission("routes", "manage");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">03 — new standee</p>
        <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
          Create standee
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          One stand, two to four QR codes. Each QR gets its own permanent link
          and its own scan count, so you can see which platform the counter
          actually earns reviews on.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <StandeeForm action={createStandee} mode="single" />
      </Card>
    </div>
  );
}
