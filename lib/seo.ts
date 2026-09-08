import type { Metadata } from "next";

import { FACEBOOK_URL, PUBLIC_ORIGIN } from "@/lib/site";

export const SITE_NAME = "Goreview";
export const SITE_DESCRIPTION =
  "Get more genuine Google reviews with customized NFC and QR Google review cards for businesses in the Philippines. One-time payment, lifetime support.";
export const SEO_IMAGE = `${PUBLIC_ORIGIN}/opengraph-image`;
export const REVIEW_CARD_IMAGE = `${PUBLIC_ORIGIN}/images/goreview-card-clean-v2.webp`;
export const ORGANIZATION_ID = `${PUBLIC_ORIGIN}#organization`;
export const WEBSITE_ID = `${PUBLIC_ORIGIN}#website`;

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
  "@id": ORGANIZATION_ID,
  name: SITE_NAME,
  url: PUBLIC_ORIGIN,
  description:
    "Custom NFC and QR Google review cards for businesses in the Philippines.",
  logo: publicUrl("/icon"),
  sameAs: [FACEBOOK_URL],
} as const;

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: SITE_NAME,
  alternateName: "Goreview Google Review Cards",
  url: PUBLIC_ORIGIN,
  description: SITE_DESCRIPTION,
  inLanguage: "en-PH",
  publisher: { "@id": ORGANIZATION_ID },
} as const;

export function webPageJsonLd({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) {
  const url = publicUrl(path);

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    inLanguage: "en-PH",
  } as const;
}

export function productJsonLd(url = publicUrl("/google-review-card")) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: "Goreview Google Review Card",
    description:
      "A customized NFC and QR card that sends customers directly to a business's Google review page.",
    image: [REVIEW_CARD_IMAGE],
    url,
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

export function articleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  articleSection,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  articleSection: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: title,
    description,
    image: [SEO_IMAGE],
    datePublished,
    dateModified,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    articleSection,
    author: { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en-PH",
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
