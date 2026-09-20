import type { Metadata } from "next";
import Image from "next/image";

import { CardFan } from "@/components/card-fan";
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
import { container, primaryButton, secondaryButton } from "@/components/styles";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  metadataForPage,
  organizationJsonLd,
  publicUrl,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const PATH = "/tap-cards";
const URL = publicUrl(PATH);

export const metadata: Metadata = metadataForPage({
  title: "Tap Cards for Google, Facebook & Instagram | Goreview",
  description:
    "3×4-inch adhesive NFC and QR tap cards for Philippine businesses. Google reviews, Facebook Pages, or Instagram profiles. ₱299 each, minimum three cards.",
  path: PATH,
  imageAlt: "Goreview NFC and QR tap cards for Google, Facebook, and Instagram",
});

/** The shared story. Everything here is true of all three cards, so it is said
 *  once at the top rather than three times down the page. */
const shared = [
  [
    "Tap or scan",
    "NFC for a quick tap on phones that support it, and a printed QR code that any camera can read. Customers use whichever their phone offers first.",
  ],
  [
    "No app to install",
    "The card opens the destination in the phone's own browser or app. Nothing to download, no account to make, no counter staff walking anyone through it.",
  ],
  [
    "Editable later",
    "The printed Goreview link never changes, so a card you hand out today keeps working. Authorized staff can update where it points from the dashboard.",
  ],
] as const;

/** What actually differs between the three. Each card sends customers somewhere
 *  different, and "somewhere different" changes where the card belongs and what
 *  a good result looks like. */
const platforms = [
  {
    id: "google",
    name: "Google",
    image: "/images/google-tap-card-cutout.png",
    accent: "#4285f4",
    eyebrow: "Google review card",
    headline: "Straight to your review screen",
    copy:
      "The Google card opens your business's Google review screen with the rating stars already on it. Customers skip searching Maps, scrolling past the wrong branch, and hunting for the review button — the step where most honest reviews quietly get abandoned.",
    bestFor:
      "Checkout counters, reception desks, and the folder a receipt comes back in — anywhere the transaction has just finished well.",
    note:
      "Reviews on your Google Business Profile are the ones that show next to your name in Search and Maps, which is why this is the card most businesses start with.",
  },
  {
    id: "facebook",
    name: "Facebook",
    image: "/images/facebook-tap-card-cutout.png",
    accent: "#1877f2",
    eyebrow: "Facebook card",
    headline: "Your Page, Reviews, or Recommendations",
    copy:
      "The Facebook card can point at your Page, or straight at its Reviews and Recommendations tab. For a lot of Philippine businesses Facebook is the storefront customers actually check first, so a recommendation there does the work a website would do elsewhere.",
    bestFor:
      "Table tents, service desks, and delivery packaging, where customers have a moment to sit with their phone rather than a queue behind them.",
    note:
      "Tell us which destination you want when you order. It is a setting on our end, not a reprint, so you can change your mind later.",
  },
  {
    id: "instagram",
    name: "Instagram",
    image: "/images/instagram-tap-card-cutout.png",
    accent: "#e1306c",
    eyebrow: "Instagram card",
    headline: "Follows, not reviews",
    copy:
      "Instagram has no review system, so this card does a different job: it opens your profile so a customer standing in front of you can follow in one tap. It is for the businesses people photograph — cafés, salons, studios, anything where the room is part of the product.",
    bestFor:
      "Fitting rooms, café tables, styling stations, and event booths — the places where someone is already holding a phone.",
    note:
      "Pair it with a Google card on the same counter. One asks for the review, the other keeps the customer around to see what you post next.",
  },
] as const;

const placements = [
  ["Counters and checkout", "The card sits where the conversation naturally ends."],
  ["Tables and reception", "A card per table or a single card on the desk."],
  ["Walls and glass doors", "The adhesive back holds on painted wall, tile, and glass."],
  ["Menus and receipts", "Small enough to clip, slip in, or hand over with change."],
] as const;

const faqs = [
  [
    "How much is a tap card, and is there a minimum?",
    "Tap cards are ₱299 each with a minimum of three cards per order. The three can be any mix of Google, Facebook, and Instagram — three Google cards, or one of each, or any other combination.",
  ],
  [
    "Do customers need an NFC phone?",
    "No. Every card carries both NFC and a printed QR code. Phones with NFC can tap the card; every other phone scans the QR code with its normal camera. Nobody is left without a way in.",
  ],
  [
    "Can I change where a card points after it is printed?",
    "Yes. The printed Goreview link stays the same for the life of the card, and authorized staff can change its destination from the dashboard. Cards already in customers' hands follow the new destination.",
  ],
  [
    "What is the difference between a tap card and the standee?",
    "The tap card is a 3×4-inch adhesive card for walls, tables, and counters. The standee is a freestanding display for a counter or reception desk, and it is the flagship product. Many businesses use the standee at the main counter and tap cards everywhere else.",
  ],
  [
    "How are the cards customized?",
    "Each card is printed with your business details and configured to your own destination before it ships. Send your business name and the link or Page you want it to open when you make an inquiry.",
  ],
  [
    "Do you deliver outside Cagayan de Oro?",
    "Yes. Delivery within CDO is free, and nationwide shipping is available across the Philippines.",
  ],
] as const;

export default function TapCardsPage() {
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      name: "NFC & QR Tap Cards for Google, Facebook, and Instagram",
      description:
        "3×4-inch adhesive NFC and QR tap cards for Philippine businesses, at ₱299 each with a minimum of three cards.",
      path: PATH,
    }),
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${URL}#product`,
      name: "Goreview NFC & QR Tap Card",
      description:
        "A 3×4-inch adhesive NFC and QR card that opens a business's Google review screen, Facebook Page, or Instagram profile.",
      image: platforms.map((platform) => publicUrl(platform.image)),
      url: URL,
      brand: { "@type": "Brand", name: "Goreview" },
      category: "NFC and QR tap cards",
      offers: {
        "@type": "Offer",
        priceCurrency: "PHP",
        price: "299",
        availability: "https://schema.org/InStock",
        url: URL,
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          minValue: 3,
          unitText: "cards",
        },
        seller: organizationJsonLd,
      },
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Tap cards", path: PATH },
    ]),
    faqJsonLd(faqs.map(([question, answer]) => ({ question, answer }))),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
            style={{
              background:
                "radial-gradient(90% 60% at 78% 0%, rgb(66 133 244 / 12%) 0%, transparent 62%)",
            }}
          />
          <div className={`${container} py-12 md:py-20`}>
            <div className="max-w-2xl">
              <p className="eyebrow">Tap cards</p>
              <h1 className="text-display mt-4 text-balance">
                One card, one tap,{" "}
                <span className="display-heading text-muted">
                  wherever customers pause.
                </span>
              </h1>
              <p className="text-body-lg mt-6 text-muted">
                A 3×4-inch adhesive NFC and QR card that opens your Google
                review screen, your Facebook Page, or your Instagram profile.
                Stick it on a wall, table, counter, or anywhere the conversation
                naturally ends.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PressLink href="/order" className={`${primaryButton} min-h-12 px-6`}>
                  Order tap cards
                </PressLink>
                <PressLink href="/#products" className={`${secondaryButton} min-h-12 px-6`}>
                  See every product
                </PressLink>
              </div>
              <p className="mt-5 text-[0.8125rem] text-subtle">
                ₱299 each · Minimum 3 cards total · Mix platforms · Free
                delivery within CDO
              </p>
            </div>

            <Reveal className="mt-14" y={28}>
              <CardFan />
            </Reveal>
          </div>
        </section>

        <section className="border-y border-line bg-surface py-20 md:py-24">
          <div className={container}>
            <Reveal className="max-w-2xl">
              <p className="eyebrow">The same in every card</p>
              <h2 className="text-title mt-4">
                Whichever platform you choose.
              </h2>
            </Reveal>
            <RevealGroup className="mt-12 grid gap-4 md:grid-cols-3">
              {shared.map(([title, copy]) => (
                <RevealItem key={title}>
                  <article className="h-full rounded-2xl border border-line bg-canvas p-7">
                    <p className="eyebrow">{title}</p>
                    <p className="mt-4 text-[0.9375rem] leading-7 text-muted">
                      {copy}
                    </p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {/* One section per platform. These are the paragraphs that used to live
            on three near-identical pages; side by side they can finally say how
            the cards differ instead of repeating what they share. */}
        <section id="platforms" className="scroll-mt-20 py-20 md:py-28">
          <div className={container}>
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Three destinations</p>
              <h2 className="text-title mt-4">
                Where each card sends your customer.
              </h2>
            </Reveal>

            <div className="mt-16 flex flex-col gap-20 md:gap-28">
              {platforms.map((platform, index) => (
                <Reveal key={platform.id} y={28}>
                  <article
                    id={platform.id}
                    className={`scroll-mt-24 grid items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-14 ${
                      // Alternate sides so the page reads as a sequence rather
                      // than a stack of identical rows.
                      index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                    }`}
                  >
                    <ParallaxLayer distance={18}>
                      <TiltStage
                        strength={9}
                        className="relative mx-auto w-full max-w-[300px]"
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-[18%] bottom-[2%] -z-10 h-9 rounded-[50%] bg-ink/16 blur-2xl"
                        />
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 -z-10 scale-150 rounded-[50%] blur-3xl"
                          style={{ background: `${platform.accent}1f` }}
                        />
                        <Image
                          src={platform.image}
                          alt={`${platform.name} 3×4-inch NFC and QR tap card`}
                          width={900}
                          height={1200}
                          sizes="(max-width: 767px) 62vw, 300px"
                          className="h-auto w-full object-contain drop-shadow-[0_22px_34px_rgb(29_29_31/18%)]"
                        />
                      </TiltStage>
                    </ParallaxLayer>

                    <div>
                      <p className="eyebrow">{platform.eyebrow}</p>
                      <h3 className="text-subtitle mt-4 text-balance">
                        {platform.headline}
                      </h3>
                      <p className="mt-5 text-[0.9375rem] leading-7 text-muted">
                        {platform.copy}
                      </p>
                      <dl className="mt-7 flex flex-col gap-5 border-t border-line pt-6">
                        <div>
                          <dt className="eyebrow">Best placed</dt>
                          <dd className="mt-2 text-[0.9375rem] leading-7 text-muted">
                            {platform.bestFor}
                          </dd>
                        </div>
                        <div>
                          <dt className="eyebrow">Worth knowing</dt>
                          <dd className="mt-2 text-[0.9375rem] leading-7 text-muted">
                            {platform.note}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface py-20 md:py-24">
          <div className={container}>
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Placement</p>
              <h2 className="text-title mt-4">Where a card actually goes.</h2>
            </Reveal>
            <RevealGroup className="mt-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
              {placements.map(([title, copy]) => (
                <RevealItem key={title}>
                  <article className="border-t border-line pt-5">
                    <h3 className="text-[0.9375rem] font-semibold">{title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-7 text-muted">
                      {copy}
                    </p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className={container}>
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Questions</p>
              <h2 className="text-title mt-4">Before you order.</h2>
            </Reveal>
            <Reveal className="mt-12">
              <Faq items={faqs} />
            </Reveal>
          </div>
        </section>
      </main>

      <PublicCta
        title="Put your next review within reach."
        description="Choose your quantities and mix platforms in one simple order inquiry."
      />
      <PublicFooter />
    </>
  );
}
