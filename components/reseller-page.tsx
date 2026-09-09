import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/json-ld";
import { LandingMotion } from "@/components/landing-motion";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { RESELLER_EMAIL } from "@/lib/site";

const container =
  "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";
const heading =
  "text-[clamp(2.25rem,9vw,3.25rem)] font-normal leading-[1.08] tracking-[-.055em] md:text-[clamp(3rem,5vw,4.5rem)]";
const reveal = "reveal motion-reduce:opacity-100 motion-reduce:transform-none";
const ctaBase =
  "inline-flex min-h-12 items-center justify-center gap-5 rounded-lg border px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4";

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
];

const steps = [
  ["01 / TALK", "Choose your starting volume", "Tell me where you sell and how many businesses you want to approach. We’ll agree on the right first batch and partner price."],
  ["02 / LEARN", "Get trained, not left guessing", "We’ll walk through card setup, the management workspace, testing, and a simple way to explain Goreview to business owners."],
  ["03 / SELL", "Bring it to local businesses", "Package the card with your service, help each client get set up, and earn from every sale while I remain available for support."],
];

const faqs = [
  ["How much is the reseller price?", "Reseller pricing depends on your order quantity. Send an inquiry with the number of cards you want to start with and your location, and I’ll provide a clear quote."],
  ["Do I need technical experience?", "No. You’ll be guided through the setup process and how to use the management system. Comfort using a phone and browser is enough to get started."],
  ["What does management access include?", "You’ll receive private workspace access for managing the Goreview cards assigned to your reseller account. We’ll cover the workflow during onboarding."],
  ["Is profit guaranteed?", "No business can guarantee profit. The program is structured to give you partner pricing and room to build a healthy margin; your results depend on your pricing, local demand, and sales effort."],
];

function ResellerCta({ children, className = "", onLight = false }: { children: React.ReactNode; className?: string; onLight?: boolean }) {
  const tone = onLight
    ? "border-[#101010] bg-[#101010] text-white hover:bg-[#333] focus-visible:outline-[#101010]"
    : "border-ink bg-ink text-canvas hover:bg-brand-strong focus-visible:outline-ink";
  return <a href={RESELLER_EMAIL} className={`${ctaBase} ${tone} ${className}`}>{children}<span aria-hidden="true">↗</span></a>;
}

export function ResellerPage() {
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      path: "/resellers",
      name: "Become a Goreview Reseller | Philippines",
      description: "Bulk partner pricing, guided setup training, and private card management access for Goreview resellers.",
    }),
    breadcrumbJsonLd([
      { name: "Goreview", path: "/" },
      { name: "Resellers", path: "/resellers" },
    ]),
  ];

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <JsonLd data={structuredData} />
      <LandingMotion />
      <a href="#main" className="fixed -top-20 left-5 z-[100] bg-ink px-5 py-3 text-canvas focus:top-3">Skip to content</a>
      <PublicHeader />
      <main id="main">
        <div className={`${container} pt-8 md:pt-12`}>
          <nav aria-label="Breadcrumb" className="text-[12px] text-muted">
            <ol className="flex items-center gap-2"><li><Link href="/" className="hover:text-ink hover:underline">Goreview</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-ink">Resellers</li></ol>
          </nav>
        </div>

        <section className={`${container} grid min-h-[650px] grid-cols-1 items-center gap-9 py-12 md:min-h-[700px] md:grid-cols-[1.08fr_.92fr] md:gap-12 md:py-16`} aria-labelledby="reseller-heading">
          <div className="relative z-10">
            <p className="eyebrow flex items-center gap-3"><span className="inline-block h-px w-8 bg-ink" aria-hidden="true" />Goreview partner program</p>
            <h1 id="reseller-heading" className="mt-6 max-w-[680px] text-[clamp(3.15rem,13vw,5rem)] font-[430] leading-[.94] tracking-[-.068em] md:text-[clamp(4rem,6vw,5.75rem)]">
              Sell local.<br /><span className="display-heading text-muted">Grow bigger.</span>
            </h1>
            <p className="mt-7 max-w-[560px] text-[16px] leading-[1.75] text-muted md:text-[19px]">Bring a simple, useful product to businesses in your area—with bulk pricing, personal setup training, and the system to manage every card you sell.</p>
            <div className="mt-7 flex flex-wrap items-center gap-5 md:mt-9"><ResellerCta>Let&apos;s talk reselling</ResellerCta><a href="#program" className="inline-flex min-h-12 items-center gap-3 px-1 py-3 text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">See what&apos;s included <span aria-hidden="true">↓</span></a></div>
            <p className="mt-6 text-[13px] leading-[1.7] text-muted">Open to independent sellers, agencies, print shops, and local business partners across the Philippines.</p>
          </div>

          <div className="relative mx-auto flex min-h-[520px] w-full max-w-[500px] items-center justify-center md:min-h-[590px]" aria-label="Goreview reseller kit">
            <div className="absolute inset-x-[8%] top-[8%] aspect-square rounded-full border border-line bg-[radial-gradient(circle_at_50%_45%,#292929_0,#141414_46%,transparent_72%)] after:absolute after:-inset-5 after:rounded-full after:border after:border-dashed after:border-line" aria-hidden="true" />
            <div className="product-float relative w-[68%] motion-reduce:animate-none md:w-[72%]">
              <Image src="/images/goreview-standee-transparent-v3.png" alt="Goreview freestanding review standee with NFC tap and QR scan options" width={1094} height={1438} sizes="(max-width: 767px) 68vw, 360px" priority className="h-auto w-full drop-shadow-[0_35px_55px_rgb(0_0_0/55%)]" />
            </div>
            <div className="absolute left-0 top-[16%] max-w-[150px] border border-line-strong bg-canvas/90 p-4 backdrop-blur-md md:-left-4 md:p-5"><p className="font-mono text-[10px] tracking-[.12em] text-subtle">YOUR EDGE</p><p className="mt-3 text-[22px] font-medium leading-tight tracking-[-.04em]">Partner<br />pricing</p></div>
            <div className="absolute bottom-[13%] right-0 max-w-[180px] rounded-lg border border-line-strong bg-ink p-4 text-canvas shadow-[0_18px_55px_rgb(0_0_0/45%)] md:-right-4 md:p-5"><p className="font-mono text-[10px] tracking-[.12em] text-[#555]">INCLUDED</p><p className="mt-3 text-[15px] font-semibold leading-snug">Training + private management access</p></div>
          </div>
        </section>

        <section className="border-y border-line bg-[#101010]"><div className={`${container} grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0`}>{[["BULK", "Lower partner pricing"], ["GUIDED", "Personal setup training"], ["READY", "Management system access"]].map(([label, copy]) => <div key={label} className="flex items-center gap-4 py-5 sm:px-5 first:pl-0 last:pr-0"><span className="font-mono text-[10px] tracking-[.12em] text-subtle">{label}</span><span className="text-[13px]">{copy}</span></div>)}</div></section>

        <section id="program" data-reveal className={`${container} ${reveal} py-16 md:py-28`}>
          <div className="mb-10 md:flex md:items-end md:justify-between md:gap-12"><div><p className="eyebrow">A business you can explain in one sentence</p><h2 className={`${heading} mt-5 max-w-3xl`}>The product is ready.<br /><span className="display-heading text-muted">You bring the relationships.</span></h2></div><p className="mt-6 max-w-sm text-[14px] leading-[1.8] text-muted md:mt-0 md:pb-1 md:text-[15px]">Help local businesses make their Google review page easier to reach—then support them with a service that feels personal.</p></div>
          <div className="grid grid-cols-1 border-y border-line md:grid-cols-3">{benefits.map((benefit, index) => <article key={benefit.label} className={`py-8 md:px-7 md:py-10 ${index > 0 ? "border-t border-line md:border-l md:border-t-0" : ""}`}><p className="font-mono text-[10px] tracking-[.12em] text-subtle">{benefit.label.toUpperCase()}</p><h3 className="mt-14 text-[23px] font-medium leading-[1.2] tracking-[-.04em]">{benefit.title}</h3><p className="mt-4 text-[14px] leading-[1.8] text-muted md:text-[15px]">{benefit.copy}</p></article>)}</div>
        </section>

        <section data-reveal className={`${reveal} border-y border-line bg-[#f0f0ec] py-16 text-[#101010] md:py-28`}><div className={`${container} grid grid-cols-1 gap-12 md:grid-cols-[.82fr_1.18fr] md:gap-20`}><div><p className="font-mono text-[10px] tracking-[.14em] text-[#666]">WHAT YOU CAN BUILD</p><p className="mt-7 text-[clamp(4.5rem,18vw,9rem)] font-[430] leading-[.75] tracking-[-.09em]">Your<br /><span className="display-heading text-[#777]">margin.</span></p></div><div className="md:border-l md:border-[#c9c9c4] md:pl-14"><p className="max-w-xl text-[clamp(1.55rem,3vw,2.25rem)] leading-[1.25] tracking-[-.04em]">Start with a lower card cost. Add the value of your local service. Create an offer that makes sense for your market.</p><p className="mt-7 max-w-lg text-[14px] leading-[1.8] text-[#666]">Your earnings depend on the quantity you order, the package you create, and the work you put into selling it. We&apos;ll make the wholesale numbers clear before you commit.</p><ResellerCta className="mt-8" onLight>Ask for partner pricing</ResellerCta></div></div></section>

        <section data-reveal className={`${container} ${reveal} py-16 md:py-28`}><div className="mb-10"><p className="eyebrow">Your path from first batch to first client</p><h2 className={`${heading} mt-5`}>Simple to start.<br /><span className="display-heading text-muted">Supported as you grow.</span></h2></div><ol className="border-y border-line">{steps.map(([label, title, copy]) => <li key={label} className="grid grid-cols-1 gap-4 border-b border-line py-8 last:border-b-0 md:grid-cols-[.3fr_.65fr_1.05fr] md:items-start md:gap-8 md:py-10"><span className="font-mono text-[10px] tracking-[.12em] text-subtle">{label}</span><h3 className="text-[20px] font-medium leading-tight tracking-[-.035em]">{title}</h3><p className="max-w-lg text-[14px] leading-[1.8] text-muted md:text-[15px]">{copy}</p></li>)}</ol></section>

        <section data-reveal className={`${reveal} border-y border-line bg-[#101010] py-16 md:py-28`}><div className={`${container} grid grid-cols-1 gap-10 md:grid-cols-[.8fr_1.2fr] md:gap-20`}><div><p className="eyebrow">Before you begin</p><h2 className={`${heading} mt-5`}>Clear answers.<br /><span className="display-heading text-muted">No surprises.</span></h2></div><div>{faqs.map(([question, answer], index) => <details key={question} className={`group border-b border-line ${index === 0 ? "border-t" : ""}`}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">{question}<span aria-hidden="true" className="text-xl text-muted transition-transform group-open:rotate-45">+</span></summary><p className="max-w-2xl pb-6 pr-8 text-[14px] leading-[1.8] text-muted">{answer}</p></details>)}</div></div></section>

        <section className="border-b border-line py-20 text-center md:py-32"><div className={container}><p className="eyebrow">Your area. Your network. Your opportunity.</p><h2 className="mx-auto mt-6 max-w-4xl text-[clamp(2.75rem,7vw,6rem)] font-[430] leading-[.98] tracking-[-.065em]">Ready to bring Goreview<br /><span className="display-heading text-muted">to local businesses?</span></h2><p className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.8] text-muted md:text-[17px]">Tell me about your area and the number of cards you&apos;d like to start with. I&apos;ll reply with reseller pricing and the next steps.</p><ResellerCta className="mt-8">Let&apos;s talk reselling</ResellerCta><p className="mt-5 text-[12px] text-muted">Email opens with a reseller inquiry ready to send.</p></div></section>
      </main>
      <PublicFooter />
    </div>
  );
}
