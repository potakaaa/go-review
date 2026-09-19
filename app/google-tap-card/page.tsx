import type { Metadata } from "next";
import { PlatformTapCardPage } from "@/components/platform-tap-card-page";

export const metadata: Metadata = { title: "Google NFC & QR Tap Card", description: "3×4-inch Google review NFC and QR tap cards for Philippine businesses. ₱299 each, minimum three tap cards." };
export default function GoogleTapCardPage() { return <PlatformTapCardPage platform="Google" image="/images/google-tap-card-cutout.png" destination="your Google review screen" accent="#4285f4" subject="Google review" />; }
