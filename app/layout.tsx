import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://goreview.rald.site"),
  title: {
    default: "Goreview | Google Review Cards for Philippine Businesses",
    template: "%s · Goreview",
  },
  description:
    "Get more genuine Google reviews with customized NFC and QR Google review cards for businesses in the Philippines. One-time payment, lifetime support.",
  applicationName: "Goreview",
  creator: "Goreview by Helbi Solutions",
  category: "Business services",
  appleWebApp: {
    capable: true,
    title: "Goreview",
    statusBarStyle: "default",
  },
  robots: { index: true, follow: true },
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
