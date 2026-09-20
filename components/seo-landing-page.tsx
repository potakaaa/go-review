import Image from "next/image";
import Link from "next/link";

import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import {
  ParallaxLayer,
  PressLink,
  Reveal,
  RevealGroup,
  RevealItem,
  TiltStage,
} from "@/components/motion";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import { container, primaryButton, secondaryButton, textButton } from "@/components/styles";
import type { SeoLandingPage as SeoLandingPageData } from "@/lib/seo-pages";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  publicUrl,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export function SeoLandingPage({ page }: { page: SeoLandingPageData }) {
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      path: page.path,
      name: page.title,
      description: page.description,
    }),
    productJsonLd(publicUrl(page.path)),
    faqJsonLd(page.faqs),
    breadcrumbJsonLd([
      { name: "Goreview", path: "/" },
      { name: page.breadcrumb, path: page.path },
    ]),
  ];

  const faqItems = page.faqs.map(
    (faq) => [faq.question, faq.answer] as readonly [string, string],
  );

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
        <div className={`${container} pt-8 md:pt-10`}>
          <nav aria-label="Breadcrumb" className="text-[0.75rem] text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Goreview
                </Link>
              </li>
              <li aria-hidden="true" className="text-line-strong">
                /
              </li>
              <li className="text-ink" aria-current="page">
                {page.breadcrumb}
              </li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="brand-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
          />
          <div
            className={`${container} grid items-center gap-12 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:py-16`}
          >
            <div>
              <p className="eyebrow">{page.eyebrow}</p>
              <h1 className="text-display mt-4 max-w-2xl text-balance">
                {page.heroTitle}{" "}
                <span className="display-heading text-muted">{page.heroAccent}</span>
              </h1>
              <p className="text-body-lg mt-6 max-w-[560px] text-muted">
                {page.heroCopy}
              </p>

              {/* The direct answer, lifted out so a reader (or a search
                  result) gets it without reading the rest. */}
              <aside
                className="mt-7 max-w-[560px] rounded-2xl border border-line bg-surface p-5"
                aria-label="Quick answer"
              >
                <p className="eyebrow">Quick answer</p>
                <h2 className="mt-2 text-[0.9375rem] font-semibold leading-6">
                  {page.question}
                </h2>
                <p data-speakable className="mt-2 text-[0.9375rem] leading-7 text-muted">
                  {page.answer}
                </p>
              </aside>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PressLink href="/order" className={`${primaryButton} min-h-12 px-6`}>
                  Order your standee
                </PressLink>
                <PressLink
                  href="/guides/how-to-get-more-google-reviews"
                  className={`${secondaryButton} min-h-12 px-6`}
                >
                  How to get more reviews
                </PressLink>
              </div>
              <p className="mt-5 max-w-xl text-[0.8125rem] leading-6 text-subtle">
                {page.heroNote}
              </p>
            </div>

            {/* The whole standee, framed exactly as the home page frames it.
                The old crop showed the card face alone, which read as a
                different product from the one these pages sell. */}
            <ParallaxLayer distance={22}>
              <TiltStage strength={8} className="relative mx-auto w-full max-w-[420px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[14%] bottom-[6%] -z-10 h-10 rounded-[50%] bg-ink/18 blur-2xl"
                />
                <Image
                  src="/images/goreview-standee-transparent-v3.png"
                  alt="Goreview freestanding Google review standee with NFC and QR options"
                  width={1094}
                  height={1438}
                  sizes="(max-width: 767px) 78vw, 40vw"
                  className="mx-auto h-auto max-h-[560px] w-auto max-w-full object-contain drop-shadow-[0_24px_36px_rgb(29_29_31/16%)]"
                  priority
                />
              </TiltStage>
            </ParallaxLayer>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-y border-line bg-surface py-20 md:py-28">
          <div className={container}>
            <Reveal className="mb-10 md:flex md:items-end md:justify-between md:gap-10">
              <div>
                <p className="eyebrow">Why businesses use a review card</p>
                <h2 className="text-title mt-4 max-w-2xl text-balance">
                  Less friction.{" "}
                  <span className="display-heading text-muted">More chances to be heard.</span>
                </h2>
              </div>
              <p className="mt-5 max-w-sm text-[0.9375rem] leading-7 text-muted md:mt-0 md:pb-1">
                The goal is simple: make the next step clear while keeping every
                review genuine and voluntary.
              </p>
            </Reveal>

            <RevealGroup className="grid gap-4 md:grid-cols-3">
              {page.benefits.map((benefit, index) => (
                <RevealItem key={benefit.title}>
                  <article className="h-full rounded-2xl border border-line bg-canvas p-7">
                    <span className="font-mono text-[0.6875rem] tracking-[0.07em] text-subtle">
                      0{index + 1} / BENEFIT
                    </span>
                    <h3 className="text-subtitle mt-8">{benefit.title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-7 text-muted">
                      {benefit.description}
                    </p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-28">
          <div className={container}>
            <Reveal className="mb-10 md:flex md:items-end md:justify-between md:gap-10">
              <div>
                <p className="eyebrow">How it works</p>
                <h2 className="text-title mt-4">
                  From counter{" "}
                  <span className="display-heading text-muted">to customer feedback.</span>
                </h2>
              </div>
              <p className="mt-5 max-w-sm text-[0.9375rem] leading-7 text-muted md:mt-0 md:pb-1">
                A simple physical prompt can fit into the way your business
                already serves people.
              </p>
            </Reveal>

            <RevealGroup className="grid gap-4 md:grid-cols-3">
              {page.steps.map((step) => (
                <RevealItem key={step.label}>
                  <article className="h-full rounded-2xl border border-line bg-surface p-7">
                    <span className="font-mono text-[0.6875rem] tracking-[0.07em] text-subtle">
                      {step.label}
                    </span>
                    <h3 className="text-subtitle mt-8">{step.title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-7 text-muted">
                      {step.description}
                    </p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-y border-line bg-surface py-20 md:py-28">
          <div className={`${container} grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16`}>
            <Reveal>
              <p className="eyebrow">Questions, answered</p>
              <h2 className="text-title mt-4">
                Good <span className="display-heading text-muted">questions.</span>
              </h2>
              <Link href="/guides" className={`${textButton} mt-6`}>
                Read the guides
                <span aria-hidden="true">→</span>
              </Link>
            </Reveal>
            <Reveal delay={0.05}>
              <Faq items={faqItems} />
            </Reveal>
          </div>
        </section>

        <section className={`${container} py-10 md:py-14`}>
          <p className="max-w-3xl text-[0.75rem] leading-6 text-subtle">
            Goreview helps customers reach a business&apos;s Google review page.
            It does not filter feedback, offer incentives for reviews, or
            guarantee a review count, rating, or search ranking. Reviews should
            reflect genuine customer experiences.
          </p>
        </section>
      </main>

      <PublicCta />
      <PublicFooter />
    </div>
  );
}
