import type { Metadata } from "next";

import Image from "next/image";

import { JsonLd } from "@/components/json-ld";
import { Reveal, PressAnchor, PressLink } from "@/components/motion";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import { container, primaryButton, secondaryButton } from "@/components/styles";
import {
  breadcrumbJsonLd,
  metadataForPage,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { FACEBOOK_URL, ORDER_EMAIL } from "@/lib/site";

const PATH = "/about";

export const metadata: Metadata = metadataForPage({
  title: "About Goreview | NFC & QR Review Cards by Helbi Solutions",
  description:
    "Goreview is a small Philippine business making NFC and QR review cards and standees. Who we are, where we ship from, and how we handle review requests.",
  path: PATH,
  imageAlt: "Goreview NFC and QR review cards",
});

/** Question-first headings, because these are the things people actually ask
 *  before handing over money to a small business they found online. */
const sections = [
  {
    heading: "Who makes Goreview?",
    paragraphs: [
      "Goreview is a product of Helbi Solutions, a small independent business based in Cagayan de Oro, Philippines. We design, print, and configure every card and standee ourselves rather than reselling a white-label product, which is why the destinations stay editable after a card has shipped.",
      "We are not a Google, Meta, Facebook, or Instagram partner, and we are not affiliated with any of them. We build hardware that points at those platforms; what happens on the platforms themselves is between you and them.",
    ],
  },
  {
    heading: "What does Goreview actually sell?",
    paragraphs: [
      "A freestanding Google review standee for counters and reception desks, a ₱999 two-in-one standee carrying Facebook and Google Maps on the same stand, and 3×4-inch adhesive tap cards at ₱299 each with a minimum of three per order. Every product carries both an NFC tag and a printed QR code, so no customer is locked out by their phone.",
      "Each one is a one-time purchase. There is no subscription, no per-scan fee, and no account a customer has to make to use one.",
    ],
  },
  {
    heading: "Where do you deliver?",
    paragraphs: [
      "Delivery within Cagayan de Oro is free, and we ship nationwide across the Philippines. Orders start as an inquiry rather than a checkout, so we can confirm artwork, quantities, destinations, and delivery before anything goes into production.",
    ],
  },
  {
    heading: "How do you feel about review incentives?",
    paragraphs: [
      "We do not build anything that filters, gates, or buys reviews, and we would rather lose a sale than help with it. Offering rewards for reviews, or routing unhappy customers away from the review form, is against Google's own prohibited-content policy and it tends to end badly for the business that tries it.",
      "A Goreview card does one thing: it removes the searching. The customer still decides whether to write anything, and what to say. That is the whole point — a review that survives scrutiny is worth more than ten that do not.",
    ],
  },
] as const;

export default function AboutPage() {
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      path: PATH,
      name: "About Goreview",
      description:
        "Goreview is a small Philippine business making NFC and QR review cards and standees, based in Cagayan de Oro.",
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "About", path: PATH },
    ]),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <PublicHeader />

      <main>
        <article className="mx-auto w-[calc(100%-2.5rem)] max-w-[46rem] pt-12 pb-16 md:pt-16 md:pb-24">
          <p className="eyebrow">About</p>
          <h1 className="text-display mt-4 text-balance">
            A small shop making the ask easier.
          </h1>
          <p className="text-body-lg mt-6 text-muted" data-speakable>
            Goreview is made by Helbi Solutions in Cagayan de Oro. We print NFC
            and QR cards that take a customer straight to your review page, so
            the moment a good experience ends does not get spent searching.
          </p>
          <Image
            src="/images/shop-2.webp"
            alt="A Goreview stand next to a GCash sign on a food shop counter."
            width={1200}
            height={1600}
            sizes="(max-width: 767px) 90vw, 46rem"
            className="mt-8 h-auto w-full rounded-2xl border border-line bg-surface object-cover"
          />

          <div className="mt-12 border-t border-line pt-10 md:mt-16 md:pt-14">
            {sections.map((section) => (
              <section key={section.heading} className="mb-12 last:mb-0 md:mb-16">
                <h2 className="text-subtitle text-[clamp(1.375rem,3vw,1.875rem)]">
                  {section.heading}
                </h2>
                <div className="mt-5 space-y-5 text-[1.0625rem] leading-[1.75] text-muted">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}

            <section>
              <h2 className="text-subtitle text-[clamp(1.375rem,3vw,1.875rem)]">
                How can you reach us?
              </h2>
              <div className="mt-5 space-y-5 text-[1.0625rem] leading-[1.75] text-muted">
                <p>
                  Message the Facebook Page or send an email. A real person
                  answers, usually the same person who will print your cards.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <PressLink href="/order" className={`${primaryButton} min-h-12 px-6`}>
                  Start an order inquiry
                </PressLink>
                <PressAnchor
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${secondaryButton} min-h-12 px-6`}
                >
                  Facebook Page ↗
                </PressAnchor>
                <PressAnchor
                  href={ORDER_EMAIL}
                  className={`${secondaryButton} min-h-12 px-6`}
                >
                  Email us
                </PressAnchor>
              </div>
            </section>
          </div>

          <Reveal className="mt-14">
            <p className="text-[0.8125rem] leading-6 text-subtle">
              Goreview is independent and is not affiliated with Google, Meta,
              Facebook, or Instagram. Google&rsquo;s own policy on what is and
              is not allowed in reviews is published in its{" "}
              <a
                href="https://support.google.com/contributionpolicy/answer/7400114"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                prohibited and restricted content policy
              </a>
              , and the NFC behaviour these cards rely on is defined by the{" "}
              <a
                href="https://www.iso.org/standard/70171.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                ISO/IEC 14443 standard
              </a>
              .
            </p>
          </Reveal>
        </article>
      </main>

      <PublicCta
        title="Put your next review within reach."
        description="Tell us your quantities and business details, and we will confirm the rest before anything is printed."
      />
      <PublicFooter />
    </>
  );
}
