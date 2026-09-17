import type { Metadata } from "next";
import { PlatformTapCardPage } from "@/components/platform-tap-card-page";

export const metadata: Metadata = { title: "Instagram NFC & QR Tap Card", description: "3×4-inch Instagram NFC and QR tap cards for Philippine businesses. ₱299 each, minimum three tap cards." };
export default function InstagramTapCardPage() { return <PlatformTapCardPage platform="Instagram" image="/images/instagram-tap-card-cutout.png" destination="your Instagram profile" accent="#e1306c" />; }
