import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import { container, textButton } from "@/components/styles";
import { guides } from "@/lib/guides";
import {
  breadcrumbJsonLd,
  metadataForPage,
  organizationJsonLd,
  publicUrl,
  WEBSITE_ID,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = metadataForPage({
  title: "Google Review Guides for Businesses | Goreview",
  description:
    "Practical guides for getting more genuine Google reviews, using review links and QR codes, and choosing NFC or QR for your business.",
  path: "/guides",
  imageAlt: "Goreview guides for Google reviews and business visibility",
});

export default function GuidesPage() {
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      path: "/guides",
      name: "Google Review Guides for Businesses",
      description: metadata.description ?? "Practical guides for Google reviews and business visibility.",
    }),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${publicUrl("/guides")}#collection`,
      name: "Google Review Guides for Businesses",
      description: metadata.description,
      url: publicUrl("/guides"),
      isPartOf: { "@id": WEBSITE_ID },
      inLanguage: "en-PH",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: guides.map((guide, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: guide.title,
          url: publicUrl(`/guides/${guide.slug}`),
        })),
      },
    },
    breadcrumbJsonLd([
      { name: "Goreview", path: "/" },
      { name: "Guides", path: "/guides" },
    ]),
  ];

  return (
    <div className="min-h-dvh text-ink">
      <JsonLd data={structuredData} />
      <a
        href="#main"
        className="fixed -top-20 left-5 z-[100] rounded-b-lg bg-ink px-5 py-3 text-canvas focus:top-0"
      >
        Skip to content
      </a>
      <PublicHeader />
      <main id="main">
        <section className={`${container} py-16 md:py-24`}>
          <p className="eyebrow">The Goreview guide</p>
          <h1 className="text-display mt-4 max-w-4xl text-balance">
            Practical ways to get more{" "}
            <span className="display-heading text-muted">genuine Google reviews.</span>
          </h1>
          <p className="text-body-lg mt-6 max-w-2xl text-muted">
            Clear, policy-aware advice for businesses that want to make honest
            customer feedback easier to reach—without promising a rating or
            search position.
          </p>
        </section>

        <section className="border-y border-line bg-surface py-14 md:py-20">
          <RevealGroup className={`${container} grid grid-cols-1 gap-4 md:grid-cols-3`}>
            {guides.map((guide, index) => (
              <RevealItem key={guide.slug}>
                <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-canvas p-7 transition-colors duration-200 hover:border-line-strong">
                  <p className="font-mono text-[0.6875rem] tracking-[0.07em] text-subtle">
                    0{index + 1} / GUIDE
                  </p>
                  <h2 className="text-subtitle mt-8">
                    {/* The whole card is the target; the link just carries the
                        accessible name and the focus ring. */}
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                    >
                      {guide.title}
                    </Link>
                  </h2>
                  <p className="mt-4 flex-1 text-[0.9375rem] leading-7 text-muted">
                    {guide.excerpt}
                  </p>
                  <div className="mt-7 flex items-center justify-between gap-4 border-t border-line pt-4 text-[0.8125rem] text-muted">
                    <span>{guide.readTime}</span>
                    <span className="font-medium text-ink">
                      Read guide{" "}
                      <span aria-hidden="true" className="inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <section className={`${container} grid grid-cols-1 gap-8 py-14 md:grid-cols-[.8fr_1.2fr] md:gap-20 md:py-20`}>
          <Reveal>
            <p className="eyebrow">The operating principle</p>
            <h2 className="text-title mt-4">Make the next step obvious.</h2>
          </Reveal>
          <div className="space-y-5 text-[0.9375rem] leading-7 text-muted">
            <p>Customers are more likely to act when the request arrives at a natural moment and the path is easy to understand.</p>
            <p>Goreview combines a physical prompt, direct destination, NFC tap, and QR scan so a business can invite feedback without asking customers to search for a listing.</p>
            <Link href="/google-review-card" className={textButton}>
              See Google review cards <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </main>
      <PublicCta title="Turn a good experience into an easier invitation." />
      <PublicFooter />
    </div>
  );
}
