import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import type { SeoLandingPage as SeoLandingPageData } from "@/lib/seo-pages";
import { FACEBOOK_URL } from "@/lib/site";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  publicUrl,
} from "@/lib/seo";

const container = "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";
const heading = "text-[clamp(2rem,8vw,2.875rem)] font-normal leading-[1.14] tracking-[-.05em] md:text-[clamp(2.25rem,4vw,3.375rem)]";

export function SeoLandingPage({ page }: { page: SeoLandingPageData }) {
  const structuredData = [
    organizationJsonLd,
    productJsonLd(publicUrl(page.path)),
    faqJsonLd(page.faqs),
    breadcrumbJsonLd([
      { name: "Goreview", path: "/" },
      { name: page.heroTitle, path: page.path },
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
        <section className={`${container} grid min-h-[650px] grid-cols-1 items-center gap-10 py-14 md:min-h-[690px] md:grid-cols-[1.05fr_.95fr] md:gap-12 md:py-20`}>
          <div>
            <p className="eyebrow">{page.eyebrow}</p>
            <h1 className={`${heading} mt-5 max-w-3xl text-[clamp(2.8rem,10.8vw,4.75rem)] md:mt-6`}>
              {page.heroTitle}
              <span className="display-heading block text-muted">{page.heroAccent}</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[16px] leading-[1.8] text-muted md:mt-7 md:text-[18px]">
              {page.heroCopy}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5 md:mt-8 md:gap-6">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-between gap-5 rounded-lg border border-ink bg-ink px-5 py-3 text-sm font-semibold text-canvas transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                Get your card <span aria-hidden="true">↗</span>
              </a>
              <Link
                href="/guides/how-to-get-more-google-reviews"
                className="inline-flex min-h-12 items-center gap-3 px-1 py-3 text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                Learn how to get more reviews <span aria-hidden="true">↓</span>
              </Link>
            </div>
            <p className="mt-6 max-w-xl text-[13px] leading-[1.7] text-muted md:text-[14px]">
              <span aria-hidden="true" className="mr-2 text-lg text-ink">∞</span>
              {page.heroNote}
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="absolute inset-6 rounded-full border border-[#252525] bg-[radial-gradient(ellipse,#202020_0,#111_42%,transparent_72%)] md:inset-10" aria-hidden="true" />
            <div className="relative mx-auto aspect-square max-w-[430px] overflow-hidden rounded-[22px] border border-line bg-surface p-3 shadow-[0_24px_70px_rgb(0_0_0/35%)] md:p-5">
              <Image
                src="/images/goreview-card-clean-v2.webp"
                alt="Customized Goreview NFC and QR Google review card"
                width={720}
                height={720}
                sizes="(max-width: 767px) 90vw, 42vw"
                className="h-full w-full rounded-[14px] object-cover"
                priority
              />
            </div>
          </div>
        </section>

        <section className="border-y border-line bg-[#101010] py-16 md:py-24">
          <div className={container}>
            <div className="mb-9 md:flex md:items-end md:justify-between md:gap-8">
              <div>
                <p className="eyebrow">Why businesses use a review card</p>
                <h2 className={`${heading} mt-5 max-w-2xl`}>
                  Less friction.
                  <span className="display-heading block text-muted">More chances to be heard.</span>
                </h2>
              </div>
              <p className="mt-5 max-w-sm text-[14px] leading-[1.8] text-muted md:mt-0 md:pb-1 md:text-[15px]">
                The goal is simple: make the next step clear while keeping every review genuine and voluntary.
              </p>
            </div>
            <div className="grid grid-cols-1 border-y border-line md:grid-cols-3">
              {page.benefits.map((benefit, index) => (
                <article
                  key={benefit.title}
                  className={`py-7 md:px-6 md:py-8 ${index > 0 ? "border-t border-line md:border-l md:border-t-0" : ""}`}
                >
                  <span className="font-mono text-[11px] tracking-[.07em] text-subtle">0{index + 1} / BENEFIT</span>
                  <h3 className="mt-10 text-lg font-medium tracking-[-.02em]">{benefit.title}</h3>
                  <p className="mt-3 max-w-[340px] text-[14px] leading-[1.8] text-muted md:text-[15px]">{benefit.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${container} py-16 md:py-24`}>
          <div className="mb-9 md:flex md:items-end md:justify-between md:gap-8">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className={`${heading} mt-5`}>From counter<br /><span className="display-heading text-muted">to customer feedback.</span></h2>
            </div>
            <p className="mt-5 max-w-sm text-[14px] leading-[1.8] text-muted md:mt-0 md:pb-1 md:text-[15px]">A simple physical prompt can fit into the way your business already serves people.</p>
          </div>
          <div className="grid grid-cols-1 border-y border-line md:grid-cols-3">
            {page.steps.map((step, index) => (
              <article
                key={step.label}
                className={`py-7 md:px-6 md:py-8 ${index > 0 ? "border-t border-line md:border-l md:border-t-0" : ""}`}
              >
                <span className="font-mono text-[11px] tracking-[.07em] text-subtle">{step.label}</span>
                <h3 className="mt-10 text-lg font-medium tracking-[-.02em]">{step.title}</h3>
                <p className="mt-3 max-w-[340px] text-[14px] leading-[1.8] text-muted md:text-[15px]">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-[#101010] py-16 md:py-24">
          <div className={`${container} grid grid-cols-1 gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-20`}>
            <div>
              <p className="eyebrow">Questions, answered</p>
              <h2 className={`${heading} mt-5`}>Good<br /><span className="display-heading text-muted">questions.</span></h2>
            </div>
            <div>
              {page.faqs.map((faq, index) => (
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

        <section className={`${container} py-10 md:py-14`}>
          <p className="max-w-3xl text-[12px] leading-[1.8] text-muted md:text-[13px]">
            Goreview helps customers reach a business&apos;s Google review page. It does not filter feedback, offer incentives for reviews, or guarantee a review count, rating, or search ranking. Reviews should reflect genuine customer experiences.
          </p>
        </section>
      </main>
      <PublicCta />
      <PublicFooter />
    </div>
  );
}
