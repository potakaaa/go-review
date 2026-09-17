import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-site";
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
    image: "/images/google-tap-card-mockup-v1.png",
    copy: "A wall, table, or counter card that opens your Google review link.",
    href: "/google-review-card",
  },
  {
    platform: "Facebook",
    image: "/images/facebook-tap-card-mockup-v2.png",
    copy: "Invite customers to your Facebook Page and review flow.",
    href: "/facebook-tap-card",
  },
  {
    platform: "Instagram",
    image: "/images/instagram-tap-card-mockup-v2.png",
    copy: "Make your Instagram profile easy to find and follow.",
    href: "/instagram-tap-card",
  },
] as const;

const flagshipFeatures = [
  ["Freestanding", "Made for a counter, reception desk, or checkout area."],
  ["Tap + scan", "NFC for a quick tap, QR for any phone camera."],
  ["Google-first", "Configured around the review destination that matters most."],
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
    <div>
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
        <section className="border-b border-line">
          <div className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1180px] items-center gap-12 py-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-20 lg:py-24">
            <div className="max-w-xl">
              <p className="eyebrow">The Goreview flagship</p>
              <h1 className="mt-5 text-[clamp(3rem,7.6vw,6.5rem)] font-medium leading-[0.91] tracking-[-0.075em]">
                Make every good experience easier to review.
              </h1>
              <p className="mt-7 max-w-lg text-base leading-8 text-muted md:text-lg">
                A freestanding NFC and QR display for your Google review link.
                Put it where the conversation ends and the next review can
                begin.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/order"
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink active:scale-[0.98]"
                >
                  Order the Google standee <span aria-hidden="true">↗</span>
                </Link>
                <a
                  href="#options"
                  className="inline-flex min-h-12 items-center px-3 py-3 text-sm font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  See card options <span className="ml-2" aria-hidden="true">↓</span>
                </a>
              </div>
              <p className="mt-5 text-xs text-subtle">
                ₱699 · one-time payment · lifetime support
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-[#e7e7e3] px-5 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5">
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.14em] text-[#555652]">
                <span>Goreview / standee</span>
                <span>Tap + scan</span>
              </div>
              <Image
                src="/images/goreview-standee-transparent-v3.png"
                alt="Goreview freestanding Google review standee with NFC and QR options"
                width={1094}
                height={1438}
                sizes="(max-width: 767px) 82vw, 42vw"
                priority
                className="mx-auto mt-2 h-auto max-h-[540px] w-auto max-w-full object-contain drop-shadow-[0_28px_34px_rgb(0_0_0/28%)]"
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="border-b border-line bg-surface py-16 md:py-24">
          <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]">
            <div className="max-w-3xl">
              <p className="eyebrow">Why the standee comes first</p>
              <h2 className="mt-4 text-[clamp(2.5rem,5.8vw,5rem)] leading-[0.96] tracking-[-0.065em]">
                Built for the moment a customer is ready to say something good.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
                It stays visible on the counter, gives people two familiar ways
                to continue, and keeps the first step simple.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
              {flagshipFeatures.map(([title, copy]) => (
                <article key={title} className="bg-canvas p-6 md:p-7">
                  <p className="eyebrow">{title}</p>
                  <p className="mt-4 text-sm leading-7 text-muted">{copy}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-6 rounded-2xl border border-line-strong bg-elevated p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div>
                <p className="eyebrow">Flagship price</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <strong className="text-4xl font-medium tracking-[-0.05em]">₱699</strong>
                  <span className="text-sm text-muted">Google review standee</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  One-time payment. Lifetime support. We confirm the details with
                  you before production.
                </p>
              </div>
              <Link
                href="/order"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink active:scale-[0.98]"
              >
                Start an order inquiry <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </section>

        <section id="options" className="border-b border-line py-16 md:py-24">
          <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow">Optional add-ons</p>
                <h2 className="mt-4 text-[clamp(2.5rem,5.8vw,5rem)] leading-[0.96] tracking-[-0.065em]">
                  Need something that sticks?
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-7 text-muted md:text-right">
                These 3×4-inch adhesive tap cards are the flexible option for
                walls, tables, counters, and smaller spaces.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {cardOptions.map((card) => (
                <article
                  key={card.platform}
                  className="overflow-hidden rounded-2xl border border-line bg-surface"
                >
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#e7e7e3] p-3 sm:p-5">
                    <Image
                      src={card.image}
                      alt={`${card.platform} 3×4-inch NFC and QR tap card held in a hand`}
                      width={1254}
                      height={1254}
                      sizes="(max-width: 767px) 88vw, (max-width: 1023px) 29vw, 360px"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-xl font-medium tracking-[-0.03em]">
                        {card.platform}
                      </h3>
                      <strong className="text-sm font-semibold">₱299</strong>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">{card.copy}</p>
                    <Link
                      href={card.href}
                      className="mt-5 inline-flex min-h-11 items-center text-sm font-medium underline decoration-line underline-offset-4 transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                    >
                      View {card.platform} card <span className="ml-2" aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <strong className="text-lg font-medium tracking-[-0.02em]">
                  ₱299 per card · minimum three cards
                </strong>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Mix Google, Facebook, and Instagram in one order. Free delivery
                  within CDO; nationwide shipping is available.
                </p>
              </div>
              <Link
                href="/order"
                className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-line-strong px-6 py-3 text-sm font-semibold transition-colors hover:border-ink hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink active:scale-[0.98]"
              >
                Choose card quantities
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-surface py-16 md:py-24">
          <div className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1000px] gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
            <div>
              <p className="eyebrow">A simple order flow</p>
              <h2 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.96] tracking-[-0.065em]">
                Choose the surface. We handle the details.
              </h2>
            </div>
            <ol className="space-y-0">
              {[
                ["01", "Choose", "Start with the Google standee, or add cards for other surfaces."],
                ["02", "Send an inquiry", "Tell us your quantities, business details, and delivery area."],
                ["03", "We confirm", "We reply with setup, artwork, delivery, and payment details before production."],
              ].map(([number, title, copy]) => (
                <li
                  key={number}
                  className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-line py-6 last:border-b"
                >
                  <span className="font-mono text-xs text-subtle">{number}</span>
                  <span>
                    <strong className="block font-medium">{title}</strong>
                    <span className="mt-2 block text-sm leading-7 text-muted">{copy}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-b border-line py-16 md:py-24">
          <div className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1000px] gap-10 md:grid-cols-[0.7fr_1.3fr] md:gap-16">
            <div>
              <p className="eyebrow">Good questions</p>
              <h2 className="mt-4 text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.96] tracking-[-0.065em]">
                Before you order.
              </h2>
            </div>
            <div>
              {faqs.map(([question, answer]) => (
                <details key={question} className="group border-t border-line last:border-b">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
                    {question}
                    <span className="text-xl font-normal text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-6 text-sm leading-7 text-muted">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-[calc(100%-2.5rem)] max-w-[900px] py-20 text-center md:py-28">
          <p className="eyebrow">Ready when you are</p>
          <h2 className="mt-5 text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.07em]">
            Put the next action within reach.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted">
            Start with the Google review standee. Add adhesive cards when a
            second surface or platform makes sense.
          </p>
          <Link
            href="/order"
            className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-ink px-7 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink active:scale-[0.98]"
          >
            Start an order inquiry <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
