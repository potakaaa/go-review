import type { Metadata } from "next";
import Image from "next/image";

import { CardFan } from "@/components/card-fan";
import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import {
  Materialize,
  ParallaxLayer,
  PressLink,
  Reveal,
  RevealGroup,
  RevealItem,
  TiltStage,
} from "@/components/motion";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import { container, primaryButton, secondaryButton } from "@/components/styles";
import { organizationJsonLd, websiteJsonLd, webPageJsonLd } from "@/lib/seo";
import { PUBLIC_ORIGIN } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Google Review Standee & Tap Card Options | Goreview" },
  description:
    "The Goreview Google review standee is the flagship NFC and QR display, with optional 3×4-inch Facebook, Instagram, and Google tap cards from ₱299.",
  alternates: { canonical: PUBLIC_ORIGIN },
};

const cardOptions = [
  {
    platform: "Google",
    copy: "A wall, table, or counter card that opens your Google review link.",
    href: "/google-review-card",
  },
  {
    platform: "Facebook",
    copy: "Invite customers to your Facebook Page and review flow.",
    href: "/facebook-tap-card",
  },
  {
    platform: "Instagram",
    copy: "Make your Instagram profile easy to find and follow.",
    href: "/instagram-tap-card",
  },
] as const;

const flagshipFeatures = [
  ["Freestanding", "Made for a counter, reception desk, or checkout area."],
  ["Tap + scan", "NFC for a quick tap, QR for any phone camera."],
  ["Google-first", "Configured around the review destination that matters most."],
] as const;

const steps = [
  ["01", "Choose", "Start with the Google standee, or add cards for other surfaces."],
  ["02", "Send an inquiry", "Tell us your quantities, business details, and delivery area."],
  ["03", "We confirm", "We reply with setup, artwork, delivery, and payment details before production."],
] as const;

const faqs = [
  [
    "What is the main Goreview product?",
    "The Google review standee is the flagship product: a freestanding NFC and QR display for counters and reception desks.",
  ],
  [
    "Can I order the adhesive cards instead?",
    "Yes. The 3×4-inch Google, Facebook, and Instagram tap cards are optional add-ons for walls, tables, counters, and other surfaces.",
  ],
  [
    "Can I mix platforms?",
    "Yes. The three-card minimum can be any mix of Google, Facebook, and Instagram tap cards.",
  ],
  [
    "Is delivery free?",
    "Delivery is free within Cagayan de Oro for orders that meet the three-card minimum. We quote shipping separately outside CDO.",
  ],
  [
    "Do I pay online?",
    "No. The order form sends an inquiry. We confirm availability, delivery, payment, and your complete address with you directly.",
  ],
] as const;

export default function Home() {
  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd,
          websiteJsonLd,
          webPageJsonLd({
            path: "/",
            name: "Goreview Google review standee and tap card options",
            description:
              "The Goreview Google review standee, plus optional Google, Facebook, and Instagram NFC and QR tap cards.",
          }),
        ]}
      />
      <PublicHeader />

      <main>
        {/* Hero. The standee is a cutout on the page itself, not a photo in a
            box -- the only thing grounding it is its own contact shadow. */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="brand-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px]"
          />
          <div
            className={`${container} grid items-center gap-10 pt-10 pb-14 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:pt-16 md:pb-24`}
          >
            <div className="max-w-xl">
              <p className="eyebrow">The Goreview flagship</p>
              <h1 className="text-display mt-4 text-balance">
                Make every good experience easier to review.
              </h1>
              <p className="text-body-lg mt-6 max-w-lg text-muted">
                A freestanding NFC and QR display for your Google review link.
                Put it where the conversation ends and the next review can
                begin.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PressLink href="/order" className={`${primaryButton} min-h-12 px-6`}>
                  Order the Google standee
                </PressLink>
                <PressLink href="#options" className={`${secondaryButton} min-h-12 px-6`}>
                  See card options
                </PressLink>
              </div>
              <p className="mt-5 text-[0.8125rem] text-subtle">
                ₱699 · one-time payment · lifetime support
              </p>
            </div>

            <ParallaxLayer distance={26} className="relative">
              <TiltStage strength={7} className="relative mx-auto max-w-[460px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[14%] bottom-[6%] -z-10 h-10 rounded-[50%] bg-ink/18 blur-2xl"
                />
                <Image
                  src="/images/goreview-standee-transparent-v3.png"
                  alt="Goreview freestanding Google review standee with NFC and QR options"
                  width={1094}
                  height={1438}
                  sizes="(max-width: 767px) 78vw, 42vw"
                  priority
                  className="mx-auto h-auto max-h-[560px] w-auto max-w-full object-contain drop-shadow-[0_24px_36px_rgb(29_29_31/16%)]"
                />
              </TiltStage>
            </ParallaxLayer>
          </div>
        </section>

        {/* Why the standee comes first */}
        <section id="pricing" className="border-y border-line bg-surface py-20 md:py-28">
          <div className={container}>
            <Reveal className="max-w-3xl">
              <p className="eyebrow">Why the standee comes first</p>
              <h2 className="text-title mt-4 text-balance">
                Built for the moment a customer is ready to say something good.
              </h2>
              <p className="text-body-lg mt-5 max-w-2xl text-muted">
                It stays visible on the counter, gives people two familiar ways
                to continue, and keeps the first step simple.
              </p>
            </Reveal>

            <RevealGroup className="mt-12 grid gap-4 md:grid-cols-3">
              {flagshipFeatures.map(([title, copy]) => (
                <RevealItem key={title}>
                  <article className="h-full rounded-2xl border border-line bg-canvas p-7">
                    <p className="eyebrow">{title}</p>
                    <p className="mt-4 text-[0.9375rem] leading-7 text-muted">{copy}</p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>

            <Materialize className="mt-4">
              <div className="glass glass-sheen flex flex-col gap-6 rounded-2xl p-7 md:flex-row md:items-center md:justify-between md:p-9">
                <div className="relative z-10">
                  <p className="eyebrow">Flagship price</p>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <strong className="text-[2.5rem] font-semibold leading-none tracking-[-0.03em]">
                      ₱699
                    </strong>
                    <span className="text-[0.9375rem] text-muted">
                      Google review standee
                    </span>
                  </div>
                  <p className="mt-3 max-w-md text-[0.9375rem] leading-7 text-muted">
                    One-time payment. Lifetime support. We confirm the details
                    with you before production.
                  </p>
                </div>
                <PressLink
                  href="/order"
                  className={`${primaryButton} relative z-10 min-h-12 shrink-0 px-6`}
                >
                  Start an order inquiry
                </PressLink>
              </div>
            </Materialize>
          </div>
        </section>

        {/* Optional add-ons -- three cutouts floating on white */}
        <section id="options" className="scroll-mt-20 py-20 md:py-28">
          <div className={container}>
            <Reveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow">Optional add-ons</p>
                <h2 className="text-title mt-4">Need something that sticks?</h2>
              </div>
              <p className="max-w-sm text-[0.9375rem] leading-7 text-muted md:text-right">
                These 3×4-inch adhesive tap cards are the flexible option for
                walls, tables, counters, and smaller spaces.
              </p>
            </Reveal>

            {/* All three cards as one held hand, rather than three separate
                panels. One object reads as a set; three read as a comparison. */}
            <Reveal className="mt-14" y={28}>
              <CardFan />
            </Reveal>

            <RevealGroup className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
              {cardOptions.map((card) => (
                <RevealItem key={card.platform}>
                  {/* flex-1 + mt-auto: the link lands on the same baseline in
                      all three columns, however many lines the copy runs to. */}
                  <article className="group flex h-full flex-col border-t border-line pt-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-subtitle">{card.platform}</h3>
                      <strong className="text-[0.9375rem] font-semibold">₱299</strong>
                    </div>
                    <p className="mt-3 text-[0.9375rem] leading-7 text-muted">
                      {card.copy}
                    </p>
                    <PressLink
                      href={card.href}
                      className="mt-auto inline-flex min-h-11 items-center gap-1.5 pt-5 text-[0.9375rem] font-medium text-ink transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                    >
                      View {card.platform} card
                      <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                        →
                      </span>
                    </PressLink>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal className="mt-14">
              <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-7 md:flex-row md:items-center md:justify-between">
                <div>
                  <strong className="text-subtitle block">
                    ₱299 per card · minimum three cards
                  </strong>
                  <p className="mt-2 max-w-xl text-[0.9375rem] leading-7 text-muted">
                    Mix Google, Facebook, and Instagram in one order. Free
                    delivery within CDO; nationwide shipping is available.
                  </p>
                </div>
                <PressLink
                  href="/order"
                  className={`${secondaryButton} min-h-12 shrink-0 px-6`}
                >
                  Choose card quantities
                </PressLink>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Order flow */}
        <section className="border-y border-line bg-surface py-20 md:py-28">
          <div className={`${container} grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16`}>
            <Reveal>
              <p className="eyebrow">A simple order flow</p>
              <h2 className="text-title mt-4">Choose the surface. We handle the details.</h2>
            </Reveal>
            <RevealGroup as="ol">
              {steps.map(([number, title, copy]) => (
                <RevealItem
                  as="li"
                  key={number}
                  className="grid grid-cols-[2.25rem_1fr] gap-4 border-t border-line py-6 last:border-b"
                >
                  <span className="font-mono text-[0.75rem] text-subtle">{number}</span>
                  <span>
                    <strong className="block font-semibold">{title}</strong>
                    <span className="mt-2 block text-[0.9375rem] leading-7 text-muted">
                      {copy}
                    </span>
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28">
          <div className={`${container} grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16`}>
            <Reveal>
              <p className="eyebrow">Good questions</p>
              <h2 className="text-title mt-4">Before you order.</h2>
            </Reveal>
            <Reveal delay={0.05}>
              <Faq items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* Closing */}
        <section className="border-t border-line bg-surface py-24 md:py-32">
          <div className={`${container} text-center`}>
            <Reveal>
              <p className="eyebrow">Ready when you are</p>
              <h2 className="text-display mx-auto mt-4 max-w-3xl text-balance">
                Put the next action within reach.
              </h2>
              <p className="text-body-lg mx-auto mt-5 max-w-xl text-muted">
                Start with the Google review standee. Add adhesive cards when a
                second surface or platform makes sense.
              </p>
              <PressLink href="/order" className={`${primaryButton} mt-8 min-h-12 px-7`}>
                Start an order inquiry
              </PressLink>
            </Reveal>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
