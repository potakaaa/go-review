import type { Metadata } from "next";

import { FACEBOOK_URL, PUBLIC_ORIGIN } from "@/lib/site";

export const SEO_IMAGE = `${PUBLIC_ORIGIN}/opengraph-image`;

export type SeoFaq = {
  question: string;
  answer: string;
};

export function publicUrl(path = "/"): string {
  return path === "/" ? PUBLIC_ORIGIN : `${PUBLIC_ORIGIN}${path}`;
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Goreview",
  url: PUBLIC_ORIGIN,
  description:
    "Custom NFC and QR Google review cards for businesses in the Philippines.",
  sameAs: [FACEBOOK_URL],
} as const;

export function productJsonLd(url = publicUrl("/google-review-card")) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Goreview Google Review Card",
    description:
      "A customized NFC and QR card that sends customers directly to a business's Google review page.",
    image: `${PUBLIC_ORIGIN}/images/goreview-card-clean-v2.webp`,
    brand: {
      "@type": "Brand",
      name: "Goreview",
    },
    category: "Google review cards",
    offers: {
      "@type": "Offer",
      priceCurrency: "PHP",
      price: "699",
      availability: "https://schema.org/InStock",
      url,
      seller: organizationJsonLd,
    },
  } as const;
}

export function faqJsonLd(faqs: readonly SeoFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } as const;
}

export function breadcrumbJsonLd(
  items: readonly { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: publicUrl(item.path),
    })),
  } as const;
}

export function metadataForPage({
  title,
  description,
  path,
  imageAlt = "Goreview Google review cards",
}: {
  title: string;
  description: string;
  path: string;
  imageAlt?: string;
}): Metadata {
  const url = publicUrl(path);

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Goreview",
      type: "website",
      locale: "en_PH",
      images: [{ url: SEO_IMAGE, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SEO_IMAGE],
    },
  };
}
