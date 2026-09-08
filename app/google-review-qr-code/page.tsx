import type { Metadata } from "next";

import { SeoLandingPage } from "@/components/seo-landing-page";
import { requireSeoLandingPage } from "@/lib/seo-pages";
import { metadataForPage } from "@/lib/seo";

const page = requireSeoLandingPage("/google-review-qr-code");

export const metadata: Metadata = metadataForPage(page);

export default function GoogleReviewQrCodePage() {
  return <SeoLandingPage page={page} />;
}
