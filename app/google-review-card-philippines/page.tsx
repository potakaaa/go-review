import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/seo-landing-page";
import { requireSeoLandingPage } from "@/lib/seo-pages";
import { metadataForPage } from "@/lib/seo";

const page = requireSeoLandingPage("/google-review-card-philippines");

export const metadata: Metadata = metadataForPage(page);

export default function GoogleReviewCardPhilippinesPage() {
  return <SeoLandingPage page={page} />;
}
