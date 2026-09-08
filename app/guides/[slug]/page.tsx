import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import { getGuide, guides } from "@/lib/guides";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  metadataForPage,
  organizationJsonLd,
  publicUrl,
} from "@/lib/seo";

type GuidePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};

  return metadataForPage({
    title: `${guide.title} | Goreview`,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    imageAlt: guide.title,
  });
}

const container = "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";

export default async function GuidePage({ params }: GuidePageProps) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const url = publicUrl(`/guides/${guide.slug}`);
  const structuredData = [
    organizationJsonLd,
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.updatedAt,
      dateModified: guide.updatedAt,
      url,
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      author: { "@type": "Organization", name: "Goreview", url: publicUrl() },
      publisher: { "@type": "Organization", name: "Goreview", url: publicUrl() },
    },
    ...(guide.faqs ? [faqJsonLd(guide.faqs)] : []),
    breadcrumbJsonLd([
      { name: "Goreview", path: "/" },
      { name: "Guides", path: "/guides" },
      { name: guide.title, path: `/guides/${guide.slug}` },
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
        <div className={`${container} pt-10 md:pt-14`}>
          <nav aria-label="Breadcrumb" className="text-[12px] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-ink hover:underline">Goreview</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/guides" className="hover:text-ink hover:underline">Guides</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-ink" aria-current="page">{guide.title}</li>
            </ol>
          </nav>
        </div>

        <article className={`${container} max-w-[900px] pb-16 pt-12 md:pb-24 md:pt-16`}>
          <p className="eyebrow">Goreview guide · {guide.readTime}</p>
          <h1 className="mt-5 max-w-4xl text-[clamp(2.65rem,8vw,5rem)] font-normal leading-[1.08] tracking-[-.067em]">
            {guide.title}
          </h1>
          <p className="mt-7 max-w-3xl text-[17px] leading-[1.8] text-muted md:text-[19px]">{guide.excerpt}</p>
          <p className="mt-5 text-[12px] text-subtle">Updated September 8, 2026</p>

          <div className="mt-12 border-t border-line pt-10 md:mt-16 md:pt-14">
            {guide.sections.map((section) => (
              <section key={section.heading} className="mb-12 last:mb-0 md:mb-16">
                <h2 className="text-[clamp(1.65rem,4vw,2.5rem)] font-normal leading-[1.2] tracking-[-.045em]">{section.heading}</h2>
                <div className="mt-5 space-y-5 text-[15px] leading-[1.85] text-muted md:text-[16px]">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets ? (
                    <ul className="list-disc space-y-3 pl-5 marker:text-subtle">
                      {section.bullets.map((bullet) => <li key={bullet} className="pl-2">{bullet}</li>)}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </article>

        {guide.faqs ? (
          <section className="border-y border-line bg-[#101010] py-14 md:py-20">
            <div className={`${container} grid grid-cols-1 gap-8 md:grid-cols-[.8fr_1.2fr] md:gap-20`}>
              <div>
                <p className="eyebrow">Still wondering?</p>
                <h2 className="mt-5 text-[clamp(2rem,6vw,3.5rem)] font-normal leading-[1.12] tracking-[-.05em]">Questions<br /><span className="display-heading text-muted">answered.</span></h2>
              </div>
              <div>
                {guide.faqs.map((faq, index) => (
                  <details key={faq.question} className={`group border-b border-line ${index === 0 ? "border-t" : ""}`}>
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">
                      {faq.question}
                      <span aria-hidden="true" className="text-xl text-muted transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="pb-6 pr-7 text-[14px] leading-[1.8] text-muted">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className={`${container} py-12 md:py-16`}>
          <p className="max-w-3xl text-[12px] leading-[1.8] text-muted md:text-[13px]">
            For current review-request rules and Google Business Profile instructions, check Google&apos;s official guidance. Goreview is independent and does not guarantee review volume, ratings, or search rankings.
          </p>
          <a
            href="https://support.google.com/business/answer/3474122?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-11 items-center gap-3 text-[13px] font-medium text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Read Google&apos;s review guidance <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <PublicCta title="Make the next review easier to reach." />
      <PublicFooter />
    </div>
  );
}
