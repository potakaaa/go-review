import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import { Reveal } from "@/components/motion";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import { container, textButton } from "@/components/styles";
import { getGuide, guides } from "@/lib/guides";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  metadataForPage,
  organizationJsonLd,
  publicUrl,
  webPageJsonLd,
  websiteJsonLd,
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

function formatGuideDate(date: string) {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default async function GuidePage({ params }: GuidePageProps) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  const url = publicUrl(`/guides/${guide.slug}`);
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      path: `/guides/${guide.slug}`,
      name: guide.title,
      description: guide.description,
    }),
    articleJsonLd({
      title: guide.title,
      description: guide.description,
      url,
      datePublished: guide.updatedAt,
      dateModified: guide.updatedAt,
      articleSection: "Google review education",
    }),
    ...(guide.faqs ? [faqJsonLd(guide.faqs)] : []),
    breadcrumbJsonLd([
      { name: "Goreview", path: "/" },
      { name: "Guides", path: "/guides" },
      { name: guide.title, path: `/guides/${guide.slug}` },
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
        <div className={`${container} pt-10 md:pt-14`}>
          <nav aria-label="Breadcrumb" className="text-[0.75rem] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="transition-colors hover:text-ink">Goreview</Link></li>
              <li aria-hidden="true" className="text-line-strong">/</li>
              <li><Link href="/guides" className="transition-colors hover:text-ink">Guides</Link></li>
              <li aria-hidden="true" className="text-line-strong">/</li>
              <li className="text-ink" aria-current="page">{guide.title}</li>
            </ol>
          </nav>
        </div>

        {/* A reading column: ~70 characters a line, which is where long-form
            text stops costing the reader effort to track. */}
        <article className="mx-auto w-[calc(100%-2.5rem)] max-w-[46rem] pt-12 pb-16 md:pt-16 md:pb-24">
          <p className="eyebrow">Goreview guide · {guide.readTime}</p>
          <h1 className="text-display mt-4 text-balance">{guide.title}</h1>
          <p className="text-body-lg mt-6 text-muted">{guide.excerpt}</p>
          <aside className="mt-8 rounded-2xl border border-line bg-surface p-5" aria-label="Quick answer">
            <p className="eyebrow">Quick answer</p>
            <p className="mt-2 text-[0.9375rem] leading-7 text-muted">{guide.answer}</p>
          </aside>
          <p className="mt-5 text-[0.75rem] text-subtle">
            By Goreview · Updated {formatGuideDate(guide.updatedAt)}
          </p>

          <div className="mt-12 border-t border-line pt-10 md:mt-16 md:pt-14">
            {guide.sections.map((section) => (
              <section key={section.heading} className="mb-12 last:mb-0 md:mb-16">
                <h2 className="text-subtitle text-[clamp(1.375rem,3vw,1.875rem)]">
                  {section.heading}
                </h2>
                <div className="mt-5 space-y-5 text-[1.0625rem] leading-[1.75] text-muted">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets ? (
                    <ul className="list-disc space-y-3 pl-5 marker:text-line-strong">
                      {section.bullets.map((bullet) => <li key={bullet} className="pl-2">{bullet}</li>)}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        </article>

        {guide.faqs ? (
          <section className="border-y border-line bg-surface py-16 md:py-24">
            <div className={`${container} grid grid-cols-1 gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-16`}>
              <Reveal>
                <p className="eyebrow">Still wondering?</p>
                <h2 className="text-title mt-4">
                  Questions <span className="display-heading text-muted">answered.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.05}>
                <Faq items={guide.faqs.map((faq) => [faq.question, faq.answer] as const)} />
              </Reveal>
            </div>
          </section>
        ) : null}

        <section className={`${container} py-12 md:py-16`}>
          <p className="max-w-3xl text-[0.75rem] leading-6 text-subtle">
            For current review-request rules and Google Business Profile instructions, check Google&apos;s official guidance. Goreview is independent and does not guarantee review volume, ratings, or search rankings.
          </p>
          <a
            href="https://support.google.com/business/answer/3474122?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className={`${textButton} mt-4`}
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
