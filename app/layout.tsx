import type { Metadata, Viewport } from "next";

import { PUBLIC_ORIGIN } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_ORIGIN),
  title: {
    default: "Goreview | Google Review Cards for Philippine Businesses",
    template: "%s · Goreview",
  },
  description: "Get more genuine Google reviews with customized NFC and QR Google review cards for businesses in the Philippines. One-time payment, lifetime support.",
  applicationName: "Goreview",
  creator: "Goreview by Helbi Solutions",
  publisher: "Goreview by Helbi Solutions",
  authors: [{ name: "Goreview", url: PUBLIC_ORIGIN }],
  category: "Business services",
  alternates: { canonical: PUBLIC_ORIGIN },
  openGraph: {
    title: "Goreview | Google Review Cards for Philippine Businesses",
    description: "Get more genuine Google reviews with customized NFC and QR Google review cards for businesses in the Philippines. One-time payment, lifetime support.",
    url: PUBLIC_ORIGIN,
    siteName: "Goreview",
    type: "website",
    locale: "en_PH",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "Goreview NFC and QR Google review cards",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Goreview | Google Review Cards for Philippine Businesses",
    description: "Get more genuine Google reviews with customized NFC and QR Google review cards for businesses in the Philippines.",
    images: ["/opengraph-image"],
  },
  appleWebApp: {
    capable: true,
    title: "Goreview",
    statusBarStyle: "default",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the fixed bottom nav sit under the home indicator on notched phones.
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="font-sans flex min-h-full flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
