import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://goreview.rald.site"),
  title: {
    default: "Goreview",
    template: "%s · Goreview",
  },
  description:
    "Manage the permanent QR and NFC links printed on Google Review cards.",
  applicationName: "Goreview",
  appleWebApp: {
    capable: true,
    title: "Goreview",
    statusBarStyle: "default",
  },
  // Internal tool: keep every page out of search results.
  robots: { index: false, follow: false },
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
