import type { Metadata } from "next";
import { PlatformTapCardPage } from "@/components/platform-tap-card-page";
import { publicUrl } from "@/lib/seo";

export const metadata: Metadata = { title: "Facebook NFC & QR Tap Card", description: "3×4-inch Facebook NFC and QR tap cards for Philippine businesses. ₱299 each, minimum three tap cards.", alternates: { canonical: publicUrl("/facebook-tap-card") } };
export default function FacebookTapCardPage() { return <PlatformTapCardPage platform="Facebook" image="/images/facebook-tap-card-cutout.png" destination="your Facebook Page, Reviews, or Recommendations" accent="#1877f2" />; }
