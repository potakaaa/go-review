import type { Metadata } from "next";

import { CreateRouteForm } from "@/app/(dashboard)/dashboard/routes/new/create-route-form";
import { Card } from "@/components/ui";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "New route" };

export default async function NewRoutePage() {
  await requirePermission("routes", "manage");
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">03 — new route</p>
        <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
          Create route
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Generates a permanent link and QR code for one card.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <CreateRouteForm />
      </Card>
    </div>
  );
}
