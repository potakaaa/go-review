import type { Metadata } from "next";

import { ResellerPage } from "@/components/reseller-page";
import { metadataForPage } from "@/lib/seo";

export const metadata: Metadata = metadataForPage({
  title: "Become a Goreview Reseller | Philippines",
  description:
    "Buy Goreview NFC and QR cards at bulk partner pricing, get guided setup training, and manage cards for local business clients.",
  path: "/resellers",
  imageAlt: "Goreview reseller program for local business partners",
});

export default function ResellersPage() {
  return <ResellerPage />;
}
