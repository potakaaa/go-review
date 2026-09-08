import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import { guides } from "@/lib/guides";
import { breadcrumbJsonLd, metadataForPage, organizationJsonLd, publicUrl } from "@/lib/seo";

export const metadata: Metadata = metadataForPage({
  title: "Google Review Guides for Businesses | Goreview",
  description:
    "Practical guides for getting more genuine Google reviews, using review links and QR codes, and choosing NFC or QR for your business.",
  path: "/guides",
  imageAlt: "Goreview guides for Google reviews and business visibility",
});

const container = "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";

export default function GuidesPage() {
  const structuredData = [
    organizationJsonLd,
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Google Review Guides for Businesses",
      description: metadata.description,
      url: publicUrl("/guides"),
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
    <div className="min-h-dvh bg-canvas text-ink">
      <JsonLd data={structuredData} />
      <a
        href="#main"
        className="fixed -top-20 left-5 z-[100] bg-ink px-5 py-3 text-canvas focus:top-3"
      >
        Skip to content
      </a>
      <PublicHeader />
      <main id="main">
        <section className={`${container} py-16 md:py-24`}>
          <p className="eyebrow">The Goreview guide</p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.8rem,9vw,5rem)] font-normal leading-[1.08] tracking-[-.067em]">
            Practical ways to get more
            <span className="display-heading block text-muted">genuine Google reviews.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.8] text-muted md:text-[18px]">
            Clear, policy-aware advice for businesses that want to make honest customer feedback easier to reach—without promising a rating or search position.
          </p>
        </section>

        <section className="border-y border-line bg-[#101010] py-12 md:py-20">
          <div className={`${container} grid grid-cols-1 gap-5 md:grid-cols-3`}>
            {guides.map((guide, index) => (
              <article key={guide.slug} className="flex flex-col rounded-xl border border-line bg-surface p-6 md:p-7">
                <p className="font-mono text-[11px] tracking-[.07em] text-subtle">0{index + 1} / GUIDE</p>
                <h2 className="mt-8 text-xl font-normal leading-[1.25] tracking-[-.03em]">
                  <Link href={`/guides/${guide.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
                    {guide.title}
                  </Link>
                </h2>
                <p className="mt-4 flex-1 text-[14px] leading-[1.8] text-muted">{guide.excerpt}</p>
                <div className="mt-7 flex items-center justify-between gap-4 border-t border-line pt-4 text-[12px] text-muted">
                  <span>{guide.readTime}</span>
                  <Link href={`/guides/${guide.slug}`} className="font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
                    Read guide ↗
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${container} grid grid-cols-1 gap-8 py-14 md:grid-cols-[.8fr_1.2fr] md:gap-20 md:py-20`}>
          <div>
            <p className="eyebrow">The operating principle</p>
            <h2 className="mt-5 text-[clamp(2rem,6vw,3.5rem)] font-normal leading-[1.12] tracking-[-.05em]">
              Make the next step obvious.
            </h2>
          </div>
          <div className="space-y-5 text-[15px] leading-[1.8] text-muted">
            <p>Customers are more likely to act when the request arrives at a natural moment and the path is easy to understand.</p>
            <p>Goreview combines a physical prompt, direct destination, NFC tap, and QR scan so a business can invite feedback without asking customers to search for a listing.</p>
            <Link href="/google-review-card" className="inline-flex min-h-11 items-center gap-3 font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
              See Google review cards <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>
      <PublicCta title="Turn a good experience into an easier invitation." />
      <PublicFooter />
    </div>
  );
}
