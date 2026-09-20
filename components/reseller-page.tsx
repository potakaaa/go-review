import Image from "next/image";
import Link from "next/link";

import { Faq } from "@/components/faq";
import { JsonLd } from "@/components/json-ld";
import {
  Materialize,
  ParallaxLayer,
  PressAnchor,
  Reveal,
  RevealGroup,
  RevealItem,
  TiltStage,
} from "@/components/motion";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import { container, primaryButton, secondaryButton } from "@/components/styles";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { RESELLER_EMAIL } from "@/lib/site";

const benefits = [
  {
    label: "Partner pricing",
    title: "Buy lower. Build your margin.",
    copy: "Order Goreview cards in bulk at reseller pricing. Your exact rate is based on quantity, so we can shape a package around your market.",
  },
  {
    label: "Hands-on training",
    title: "Learn the complete setup.",
    copy: "I’ll personally guide you through connecting each card to a local business, testing it, and handing it over with confidence.",
  },
  {
    label: "Your workspace",
    title: "Manage every client in one place.",
    copy: "Get private access to the Goreview management system for the cards you sell, so updates stay organized as your client list grows.",
  },
] as const;

const steps = [
  [
    "01 / TALK",
    "Choose your starting volume",
    "Tell me where you sell and how many businesses you want to approach. We’ll agree on the right first batch and partner price.",
  ],
  [
    "02 / LEARN",
    "Get trained, not left guessing",
    "We’ll walk through card setup, the management workspace, testing, and a simple way to explain Goreview to business owners.",
  ],
  [
    "03 / SELL",
    "Bring it to local businesses",
    "Package the card with your service, help each client get set up, and earn from every sale while I remain available for support.",
  ],
] as const;

const faqs = [
  [
    "How much is the reseller price?",
    "Reseller pricing depends on your order quantity. Send an inquiry with the number of cards you want to start with and your location, and I’ll provide a clear quote.",
  ],
  [
    "Do I need technical experience?",
    "No. You’ll be guided through the setup process and how to use the management system. Comfort using a phone and browser is enough to get started.",
  ],
  [
    "What does management access include?",
    "You’ll receive private workspace access for managing the Goreview cards assigned to your reseller account. We’ll cover the workflow during onboarding.",
  ],
  [
    "Is profit guaranteed?",
    "No business can guarantee profit. The program is structured to give you partner pricing and room to build a healthy margin; your results depend on your pricing, local demand, and sales effort.",
  ],
] as const;

export function ResellerPage() {
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      path: "/resellers",
      name: "Become a Goreview Reseller | Philippines",
      description:
        "Bulk partner pricing, guided setup training, and private card management access for Goreview resellers.",
    }),
    breadcrumbJsonLd([
      { name: "Goreview", path: "/" },
      { name: "Resellers", path: "/resellers" },
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
        <div className={`${container} pt-8 md:pt-10`}>
          <nav aria-label="Breadcrumb" className="text-[0.75rem] text-muted">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Goreview
                </Link>
              </li>
              <li aria-hidden="true" className="text-line-strong">
                /
              </li>
              <li aria-current="page" className="text-ink">
                Resellers
              </li>
            </ol>
          </nav>
        </div>

        {/* Hero */}
        <section
          className="relative overflow-hidden"
          aria-labelledby="reseller-heading"
        >
          <div
            aria-hidden="true"
            className="brand-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-[600px]"
          />
          <div
            className={`${container} grid items-center gap-10 py-12 md:grid-cols-[1.08fr_0.92fr] md:gap-12 md:py-16`}
          >
            <div className="relative z-10">
              <p className="eyebrow flex items-center gap-3">
                <span className="inline-block h-px w-8 bg-line-strong" aria-hidden="true" />
                Goreview partner program
              </p>
              <h1 id="reseller-heading" className="text-display mt-5 max-w-[680px]">
                Sell local.{" "}
                <span className="display-heading text-muted">Grow bigger.</span>
              </h1>
              <p className="text-body-lg mt-6 max-w-[560px] text-muted">
                Bring a simple, useful product to businesses in your area—with
                bulk pricing, personal setup training, and the system to
                manage every card you sell.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PressAnchor
                  href={RESELLER_EMAIL}
                  className={`${primaryButton} min-h-12 px-6`}
                >
                  Let&apos;s talk reselling
                </PressAnchor>
                <a href="#program" className={`${secondaryButton} min-h-12 px-6`}>
                  See what&apos;s included
                </a>
              </div>
              <p className="mt-5 max-w-md text-[0.8125rem] leading-6 text-subtle">
                Open to independent sellers, agencies, print shops, and local
                business partners across the Philippines.
              </p>
            </div>

            <ParallaxLayer distance={24}>
              <div
                className="relative mx-auto flex w-full max-w-[460px] items-center justify-center"
                aria-label="Goreview reseller kit"
              >
                <TiltStage strength={7} className="relative w-[70%]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-[12%] bottom-[3%] -z-10 h-9 rounded-[50%] bg-ink/16 blur-2xl"
                  />
                  <Image
                    src="/images/goreview-standee-transparent-v3.png"
                    alt="Goreview freestanding review standee with NFC tap and QR scan options"
                    width={1094}
                    height={1438}
                    sizes="(max-width: 767px) 62vw, 320px"
                    priority
                    className="h-auto w-full drop-shadow-[0_26px_40px_rgb(29_29_31/18%)]"
                  />
                </TiltStage>

                {/* Two glass chips flanking the product. They float above the
                    page, so they get the material -- the product does not. */}
                <Materialize
                  className="absolute left-0 top-[14%] max-w-[9.5rem]"
                  delay={0.15}
                >
                  <div className="glass glass-sheen rounded-2xl p-4">
                    <p className="relative z-10 font-mono text-[0.625rem] tracking-[0.12em] text-subtle">
                      YOUR EDGE
                    </p>
                    <p className="relative z-10 mt-2 text-[1.25rem] font-semibold leading-tight tracking-[-0.02em]">
                      Partner
                      <br />
                      pricing
                    </p>
                  </div>
                </Materialize>

                <Materialize
                  className="absolute bottom-[10%] right-0 max-w-[11rem]"
                  delay={0.25}
                >
                  <div className="rounded-2xl bg-ink p-4 text-canvas shadow-[0_18px_40px_rgb(29_29_31/22%)]">
                    <p className="font-mono text-[0.625rem] tracking-[0.12em] text-canvas/55">
                      INCLUDED
                    </p>
                    <p className="mt-2 text-[0.9375rem] font-medium leading-snug">
                      Training + private management access
                    </p>
                  </div>
                </Materialize>
              </div>
            </ParallaxLayer>
          </div>
        </section>

        {/* Summary strip */}
        <section className="border-y border-line bg-surface">
          <div
            className={`${container} grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0`}
          >
            {[
              ["BULK", "Lower partner pricing"],
              ["GUIDED", "Personal setup training"],
              ["READY", "Management system access"],
            ].map(([label, copy]) => (
              <div
                key={label}
                className="flex items-center gap-4 py-5 first:pl-0 last:pr-0 sm:px-5"
              >
                <span className="font-mono text-[0.625rem] tracking-[0.12em] text-subtle">
                  {label}
                </span>
                <span className="text-[0.875rem]">{copy}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Program */}
        <section id="program" className={`${container} scroll-mt-20 py-20 md:py-28`}>
          <Reveal className="mb-10 md:flex md:items-end md:justify-between md:gap-12">
            <div>
              <p className="eyebrow">A business you can explain in one sentence</p>
              <h2 className="text-title mt-4 max-w-3xl text-balance">
                What does a Goreview reseller actually do?{" "}
                <span className="display-heading text-muted">You bring the relationships.</span>
              </h2>
            </div>
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-7 text-muted md:mt-0 md:pb-1">
              Help local businesses make their Google review page easier to
              reach—then support them with a service that feels personal.
            </p>
          </Reveal>

          <RevealGroup className="grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <RevealItem key={benefit.label}>
                <article className="h-full rounded-2xl border border-line bg-surface p-7 md:p-8">
                  <p className="font-mono text-[0.625rem] tracking-[0.12em] text-subtle">
                    {benefit.label.toUpperCase()}
                  </p>
                  <h3 className="text-subtitle mt-10">{benefit.title}</h3>
                  <p className="mt-4 text-[0.9375rem] leading-7 text-muted">
                    {benefit.copy}
                  </p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        {/* The one dark band on the page. It marks the commercial argument as
            a different kind of moment without introducing a second hue. */}
        <section className="border-y border-line bg-ink py-20 text-canvas md:py-28">
          <div
            className={`${container} grid grid-cols-1 gap-12 md:grid-cols-[0.82fr_1.18fr] md:gap-16`}
          >
            <Reveal>
              <p className="font-mono text-[0.625rem] tracking-[0.14em] text-canvas/50">
                WHAT YOU CAN BUILD
              </p>
              <p className="mt-6 text-[clamp(4rem,14vw,7rem)] font-semibold leading-[0.82] tracking-[-0.045em]">
                Your
                <br />
                <span className="text-canvas/45">margin.</span>
              </p>
            </Reveal>
            <Reveal delay={0.05} className="md:border-l md:border-canvas/15 md:pl-14">
              <p className="text-[clamp(1.375rem,2.6vw,2rem)] font-medium leading-[1.3] tracking-[-0.02em]">
                Start with a lower card cost. Add the value of your local
                service. Create an offer that makes sense for your market.
              </p>
              <p className="mt-7 max-w-lg text-[0.9375rem] leading-7 text-canvas/60">
                Your earnings depend on the quantity you order, the package you
                create, and the work you put into selling it. We&apos;ll make
                the wholesale numbers clear before you commit.
              </p>
              <PressAnchor
                href={RESELLER_EMAIL}
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-canvas px-6 text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:bg-canvas/85 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-canvas"
              >
                Ask for partner pricing
              </PressAnchor>
            </Reveal>
          </div>
        </section>

        {/* Steps */}
        <section className={`${container} py-20 md:py-28`}>
          <Reveal className="mb-10">
            <p className="eyebrow">Your path from first batch to first client</p>
            <h2 className="text-title mt-4">
              Simple to start.{" "}
              <span className="display-heading text-muted">Supported as you grow.</span>
            </h2>
          </Reveal>
          <RevealGroup as="ol" className="border-t border-line">
            {steps.map(([label, title, copy]) => (
              <RevealItem
                as="li"
                key={label}
                className="grid grid-cols-1 gap-4 border-b border-line py-8 md:grid-cols-[0.3fr_0.65fr_1.05fr] md:items-start md:gap-8 md:py-10"
              >
                <span className="font-mono text-[0.625rem] tracking-[0.12em] text-subtle">
                  {label}
                </span>
                <h3 className="text-subtitle text-[1.25rem]">{title}</h3>
                <p className="max-w-lg text-[0.9375rem] leading-7 text-muted">{copy}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        {/* FAQ */}
        <section className="border-y border-line bg-surface py-20 md:py-28">
          <div className={`${container} grid grid-cols-1 gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16`}>
            <Reveal>
              <p className="eyebrow">Before you begin</p>
              <h2 className="text-title mt-4">
                Clear answers. <span className="display-heading text-muted">No surprises.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.05}>
              <Faq items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* Closing */}
        <section className="py-24 text-center md:py-32">
          <div className={container}>
            <Reveal>
              <p className="eyebrow">Your area. Your network. Your opportunity.</p>
              <h2 className="text-display mx-auto mt-5 max-w-4xl text-balance">
                Ready to bring Goreview{" "}
                <span className="display-heading text-muted">to local businesses?</span>
              </h2>
              <p className="text-body-lg mx-auto mt-6 max-w-xl text-muted">
                Tell me about your area and the number of cards you&apos;d like
                to start with. I&apos;ll reply with reseller pricing and the
                next steps.
              </p>
              <PressAnchor
                href={RESELLER_EMAIL}
                className={`${primaryButton} mt-8 min-h-12 px-7`}
              >
                Let&apos;s talk reselling
              </PressAnchor>
              <p className="mt-5 text-[0.75rem] text-subtle">
                Email opens with a reseller inquiry ready to send.
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
