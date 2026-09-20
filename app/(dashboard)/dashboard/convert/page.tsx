import type { Metadata } from "next";

import { FacebookReviewConverter } from "@/components/facebook-review-converter";
import { GoogleReviewConverter } from "@/components/google-review-converter";
import { Card } from "@/components/ui";
import { requirePermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Convert review link" };

export default async function ConvertMapsLinkPage() {
  await requirePermission("convert", "view");
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">05 — utility</p>
        <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
          Convert review link
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Turn a Google Maps share link or a Facebook Page link into a direct
          link that opens the business&apos;s review screen.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <h2 className="eyebrow mb-4">Google Maps</h2>
        <GoogleReviewConverter autoFocus />
      </Card>

      <Card className="p-5 sm:p-7">
        <h2 className="eyebrow mb-4">Facebook</h2>
        <FacebookReviewConverter />
      </Card>
    </div>
  );
}
