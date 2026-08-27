import type { Metadata } from "next";

import { GoogleReviewConverter } from "@/components/google-review-converter";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Convert Maps link" };

export default function ConvertMapsLinkPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="eyebrow">05 — utility</p>
        <h1 className="display-heading mt-3 text-4xl text-ink sm:text-5xl">
          Convert Maps link
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Turn a Google Maps share link into a direct link that opens the place&apos;s
          review flow.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <GoogleReviewConverter />
      </Card>
    </div>
  );
}
