import type { Metadata } from "next";
import Link from "next/link";
import { FACEBOOK_URL, ORDER_EMAIL, PUBLIC_ORIGIN } from "@/lib/site";
import { ProductPhoto, LandingMotion } from "@/components/landing-motion";
import { CustomOfferings } from "@/components/custom-offerings";
import { JsonLd } from "@/components/json-ld";
import { ShopStoryCard } from "@/components/shop-story";
import { getPublishedStories } from "@/lib/stories";
import {
  faqJsonLd,
  organizationJsonLd,
  productJsonLd,
  publicUrl,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { reviewDifference } from "@/lib/story-validation";

export const metadata: Metadata = {
  title: { absolute: "Google Review Cards for Philippine Businesses | Goreview" },
  description: "Get more genuine Google reviews with customized NFC and QR Google review cards from ₱699. One-time payment, lifetime support, and shipping across the Philippines.",
  robots: { index: true, follow: true },
  alternates: { canonical: PUBLIC_ORIGIN },
  openGraph: { title: "Google Review Cards for Philippine Businesses | Goreview", description: "Get more genuine Google reviews with a simple NFC and QR review card. From ₱699, with lifetime support.", url: PUBLIC_ORIGIN, siteName: "Goreview", type: "website", locale: "en_PH", images: [{ url: `${PUBLIC_ORIGIN}/opengraph-image`, width: 1200, height: 630, alt: "Goreview NFC and QR Google review cards" }] },
  twitter: { card: "summary_large_image", title: "Google Review Cards for Philippine Businesses | Goreview", description: "Get more genuine Google reviews with a simple NFC and QR review card.", images: [`${PUBLIC_ORIGIN}/opengraph-image`] },
};

export const revalidate = 60;

const faqs = [
  ["How does the card work?", "Customers tap an NFC-enabled phone on the card or scan its QR code with their camera. Your business’s Google review page opens, where they can share their experience. NFC support depends on the phone; scanning the QR code is the alternative."],
  ["Is there a monthly fee?", "No. You pay once for your Goreview card. Lifetime support is included—no recurring payment for the card or its support."],
  ["Will it be set up for my business?", "Yes. Your card is customized and set up for your business. Contact Helbi Solutions with your business details and the number of cards you need to arrange your order."],
  ["What if I need help later?", "Your purchase includes lifetime support. Reach out to Helbi Solutions through Facebook or email whenever you need help with your Goreview card."],
  ["Do you ship to my area?", "We ship anywhere in the Philippines. Contact us to confirm shipping costs and delivery arrangements for your location."],
  ["Can I order more than two cards?", "Absolutely. Two cards cost ₱1,199, saving ₱199 compared with buying them separately. Contact us for a larger-order discount tailored to the quantity you need."],
  ["Does Goreview guarantee more reviews?", "Goreview makes it easier for customers to reach your Google review page. Leaving a review is always their choice. Any shop results shown here are observed changes over the stated dates, not a guarantee of future results."],
];

function OrderLink({ className = "", children = "Order via Facebook", compact = false }: { className?: string; children?: React.ReactNode; compact?: boolean }) {
  const size = compact ? "min-h-10 px-3 py-2 text-[12px] sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-[14px]" : "min-h-12 px-5 py-3 text-[14px]";
  return <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-between rounded-lg border border-ink bg-ink font-semibold text-canvas transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${size} ${className}`}>{children}<span aria-hidden="true">↗</span></a>;
}

const container = "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";
const section = "scroll-mt-[68px] py-[70px] md:scroll-mt-[84px] md:py-[110px]";
const kicker = "text-[12px] font-medium leading-[1.7] tracking-[.07em] text-muted md:text-[13px]";
const heading = "text-[clamp(2rem,8vw,2.875rem)] font-normal leading-[1.14] tracking-[-.05em] md:text-[clamp(2.25rem,4vw,3.375rem)]";
const textLink = "inline-flex items-center gap-3.5 py-3 text-[14px] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";
const reveal = "reveal motion-reduce:opacity-100 motion-reduce:transform-none";
const mutedCopy = "max-w-[330px] text-[14px] leading-[1.8] text-muted md:text-[15px]";

function SectionHeading({ kickerText, title, accent, description }: { kickerText: string; title: React.ReactNode; accent: React.ReactNode; description: React.ReactNode }) {
  return <div className="mb-8 block md:mb-[52px] md:flex md:items-end md:justify-between md:gap-7"><div><p className={kicker}>{kickerText}</p><h2 className={`${heading} mt-5`}>{title}<span className="display-heading text-muted">{accent}</span></h2></div><p className={`${mutedCopy} mt-5 md:mt-0 md:pb-1`}>{description}</p></div>;
}

export default async function Home() {
  const stories = await getPublishedStories();
  const hasResults = stories.some(story => reviewDifference(story) !== null);
  const structuredData = [
    organizationJsonLd,
    websiteJsonLd,
    webPageJsonLd({
      path: "/",
      name: "Google Review Cards for Philippine Businesses | Goreview",
      description: "Get more genuine Google reviews with customized NFC and QR Google review cards for businesses in the Philippines.",
    }),
    productJsonLd(publicUrl("/google-review-card")),
    faqJsonLd(faqs.map(([question, answer]) => ({ question, answer }))),
  ];
  return <div>
    <JsonLd data={structuredData} />
    <LandingMotion />
    <a href="#main" className="fixed -top-20 left-5 z-[100] bg-ink px-5 py-3 text-canvas focus:top-3">Skip to content</a>
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-xl"><div className={`${container} flex h-[68px] items-center justify-between gap-4 md:h-[84px]`}><a href="#" className="text-2xl font-semibold tracking-[-1.6px] md:text-[27px]" aria-label="Goreview home">go<span className="font-normal">review</span><span className="text-muted">.</span></a><nav aria-label="Main navigation" className="flex items-center gap-[18px] md:gap-8"><a className="hidden py-3.5 text-[13px] text-muted hover:text-ink md:block" href="#how-it-works">How it works</a><Link className="hidden py-3.5 text-[13px] text-muted hover:text-ink lg:block" href="/google-review-card">Google review cards</Link><Link className="hidden py-3.5 text-[13px] text-muted hover:text-ink xl:block" href="/guides">Guides</Link><a className="py-3.5 text-[13px] text-muted hover:text-ink" href="#pricing">Pricing</a><OrderLink compact className="gap-2"><span className="sm:hidden">Get card</span><span className="hidden sm:inline">Get your card</span></OrderLink></nav></div></header>
    <main id="main">
      <section className={`${container} grid min-h-[650px] grid-cols-1 items-center gap-6 py-12 md:min-h-[720px] md:grid-cols-[1.1fr_1fr] md:gap-8 md:py-[74px]`} aria-labelledby="hero-heading">
        <div><p className={kicker}><span className="mr-2 inline-block size-1.5 rounded-full bg-ink align-px shadow-[0_0_0_4px_rgb(245_245_245/6%)]" /> A small card. A lasting impression.</p><h1 id="hero-heading" className="mt-5 text-[clamp(2.8rem,10.8vw,4.375rem)] font-[450] leading-[1.09] tracking-[-.067em] md:mt-6 md:text-[clamp(3rem,5.3vw,4.75rem)] md:leading-[1.08]">Good experiences<br />deserve to be<br /><span className="display-heading mt-1 inline-block text-[1.12em] text-muted">shared.</span></h1><p className="mt-6 max-w-[440px] text-[16px] leading-[1.75] text-muted md:mt-7 md:text-[18px]">Make leaving a Google review effortless.<br className="hidden md:block" /> A tap or a scan connects your customers to your review page—right from your counter.</p><div className="mt-6 flex flex-wrap items-center gap-5 md:mt-8 md:gap-6"><OrderLink className="min-h-[52px] px-6 text-[14px]" /><a className={textLink} href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a></div><p className="mt-6 flex flex-wrap items-center gap-x-1 text-[13px] text-muted md:text-[14px]"><span aria-hidden="true" className="mr-1 text-xl leading-none text-ink">∞</span> One-time payment. <strong className="font-medium text-ink">Lifetime support.</strong></p></div>
        <div className="relative isolate mx-auto flex h-[500px] w-full max-w-[520px] items-center justify-center md:h-[600px]"><div className="absolute -z-10 aspect-square w-full rounded-full border border-[#202020] bg-[radial-gradient(ellipse,#202020_0,#111_40%,transparent_70%)] before:absolute before:inset-[45px] before:rounded-full before:border before:border-[#252525] after:absolute after:-inset-6 after:rounded-full after:border after:border-dashed after:border-[#1b1b1b]" aria-hidden="true" /><ProductPhoto /></div>
      </section>
      <div className="border-y border-line"><div className={`${container} flex flex-wrap justify-center gap-4 py-5 md:justify-between md:gap-6 md:py-6`}>{[["↗", "Customized for your business"], ["∞", "Lifetime support included"], ["⌁", "Ships across the Philippines"]].map(([icon, label]) => <span key={label} className="flex items-center gap-2 text-[12px] text-muted md:gap-4 md:text-[13px]"><span aria-hidden="true" className="text-lg leading-none text-ink md:text-[22px]">{icon}</span>{label}</span>)}</div></div>

      <section id="how-it-works" data-reveal className={`${container} ${section} ${reveal}`}><SectionHeading kickerText="Less friction. More connection." title={<>From “thank you”<br />to </>} accent="a review." description={<>You’ve already made their day.<br />Give them an easy way to tell others.</>} /><div className="grid grid-cols-1 border-y border-line md:grid-cols-3">
        <article className="py-6 md:px-[18px] md:py-7 xl:px-7"><span className="font-mono text-[11px] tracking-[.07em] text-subtle">01 / PLACE</span><div className="step-art" aria-hidden="true"><span className="mini-stand"><span>goreview.</span><span>Tap or scan ↗</span></span><span className="counter-line" /></div><h3 className="text-base font-medium tracking-[-.02em] md:text-[16px]">A little space on your counter.</h3><p className="mt-3 max-w-[360px] text-[14px] leading-[1.8] text-muted md:text-[15px]">Set your card where customers naturally pause—at checkout, the reception desk, or their table.</p></article>
        <article className="border-t border-line py-6 md:border-l md:border-t-0 md:px-[18px] md:py-7 xl:px-7"><span className="font-mono text-[11px] tracking-[.07em] text-subtle">02 / CONNECT</span><div className="step-art" aria-hidden="true"><span className="tap-rings"><i /><i /><i /></span><span className="mini-phone">↗</span></div><h3 className="text-base font-medium tracking-[-.02em] md:text-[16px]">One tap. Or one scan.</h3><p className="mt-3 max-w-[360px] text-[14px] leading-[1.8] text-muted md:text-[15px]">Customers tap their NFC-enabled phone or scan the QR code. No searching for your business.</p></article>
        <article className="border-t border-line py-6 md:border-l md:border-t-0 md:px-[18px] md:py-7 xl:px-7"><span className="font-mono text-[11px] tracking-[.07em] text-subtle">03 / SHARE</span><div className="step-art" aria-hidden="true"><span className="mini-review"><span>Your experience</span><span>☆ ☆ ☆ ☆ ☆</span><span className="review-line" /><span className="review-line short" /></span></div><h3 className="text-base font-medium tracking-[-.02em] md:text-[16px]">Their experience, in their words.</h3><p className="mt-3 max-w-[360px] text-[14px] leading-[1.8] text-muted md:text-[15px]">Your Google review page opens, ready for their honest feedback. Simple from start to finish.</p></article>
      </div></section>

      <CustomOfferings />

      {stories.length > 0 && <section id="shops" data-reveal className={`${section} ${reveal} border-y border-line bg-[#101010]`}><div className={container}><SectionHeading kickerText="Out in the real world" title={<>On the counter.<br /></>} accent="Part of the everyday." description={<>Real shops. Real conversations.<br />A simpler invitation to leave a review.</>} /><div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-4 xl:gap-5">{stories.map(story => <ShopStoryCard story={story} key={story.id} />)}</div>{hasResults && <p className="mt-6 max-w-[700px] text-[12px] leading-[1.8] text-muted">Review changes reflect the observation dates shown. Individual results vary; these figures do not establish that every review came through Goreview.</p>}</div></section>}

      <section data-reveal className={`${container} ${reveal} grid grid-cols-1 items-center gap-4 border-b border-line py-[65px] md:grid-cols-[.85fr_1.15fr] md:gap-20 md:py-[115px]`}><div className="-ml-1 text-left text-[130px] font-extralight leading-none tracking-[-.1em] text-[#b7b7b7] md:text-center md:text-[240px]" aria-hidden="true">∞</div><div><p className={kicker}>Support doesn’t stop at checkout</p><h2 className={`${heading} mt-4 md:text-[clamp(2rem,3.3vw,2.875rem)]`}>Pay once.<br /><span className="display-heading text-muted">We’re here for the long run.</span></h2><p className="mt-6 max-w-[430px] text-[15px] leading-[1.8] text-muted md:text-[16px]">Your card comes with <strong className="font-medium text-ink">lifetime support.</strong> From getting your business set up to helping you down the road, you have someone to reach out to.</p><a href={ORDER_EMAIL} className={`${textLink} mt-4`}>Talk to us <span aria-hidden="true">↗</span></a></div></section>

      <section id="pricing" data-reveal className={`${container} ${section} ${reveal}`}><SectionHeading kickerText="A small investment in your next impression" title={<>Your counter.<br /></>} accent="Your card." description={<>Customized. Set up. Ready for your business.<br />One-time payment, lifetime support.</>} /><div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 md:gap-6">
        <article className="rounded-[14px] border border-line bg-surface p-7 md:p-9"><p className={kicker}>One good place to start</p><h3 className="mt-7 text-xl font-normal">One card</h3><p className="mt-4 text-[57px] font-[450] leading-[1.2] tracking-[-.07em] md:text-[clamp(2.875rem,5vw,4rem)]">₱699<span className="mt-2 block text-[13px] font-normal tracking-normal text-muted">one-time payment</span></p><ul className="mt-7 grid list-none gap-4 border-t border-line-strong py-7">{["Customized for your business", "NFC tap + QR scan", "Business setup included", "Lifetime support"].map(item => <li className={`flex items-center gap-3 text-[14px] before:text-ink before:content-['✓'] ${item === "Lifetime support" ? "font-medium text-ink" : "text-muted"}`} key={item}>{item}</li>)}</ul><OrderLink className="w-full border-line-strong bg-transparent text-ink hover:bg-elevated">Get one card</OrderLink></article>
        <article className="rounded-[14px] border border-[#626262] bg-elevated p-7 shadow-[inset_0_1px_0_rgb(255_255_255/6%)] md:p-9"><div className="flex items-center justify-between gap-3"><p className={kicker}>Twice the opportunity</p><span className="whitespace-nowrap rounded-md border border-line-strong px-2 py-1 text-[12px]">Save ₱199</span></div><h3 className="mt-7 text-xl font-normal">Two cards</h3><p className="mt-4 text-[57px] font-[450] leading-[1.2] tracking-[-.07em] md:text-[clamp(2.875rem,5vw,4rem)]">₱1,199<span className="mt-2 block text-[13px] font-normal tracking-normal text-muted">one-time payment · <s>₱1,398</s> separately</span></p><ul className="mt-7 grid list-none gap-4 border-t border-line-strong py-7">{["Two cards for more touchpoints", "NFC tap + QR scan", "Customized and set up for your business", "Lifetime support for both cards"].map(item => <li className={`flex items-center gap-3 text-[14px] before:text-ink before:content-['✓'] ${item.startsWith("Lifetime") ? "font-medium text-ink" : "text-muted"}`} key={item}>{item}</li>)}</ul><OrderLink className="w-full">Get two cards</OrderLink></article>
      </div><div className="mt-4 block py-6 md:mt-7 md:flex md:items-center md:justify-between md:gap-6"><p className="text-[14px]"><strong className="font-medium">More counters? More cards.</strong><span className="mt-2 block text-[13px] leading-[1.8] text-muted">Ask us about discounts for larger orders. Ships anywhere in the Philippines.</span></p><a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className={`${textLink} mt-3 shrink-0 md:mt-0`}>Let’s talk quantities ↗</a></div></section>

      <section id="faq" data-reveal className={`${container} ${section} ${reveal} grid grid-cols-1 gap-9 border-t border-line md:grid-cols-[.85fr_1.15fr] md:gap-20`}><div><p className={kicker}>A few things you might be wondering</p><h2 className={`${heading} mt-5`}>Good<br /><span className="display-heading text-muted">questions.</span></h2></div><div>{faqs.map(([question, answer], index) => <details className={`group border-b border-line ${index === 0 ? "border-t" : ""}`} key={question}><summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink [&::-webkit-details-marker]:hidden">{question}<span aria-hidden="true" className="text-xl text-muted transition-transform group-open:rotate-45">+</span></summary><p className="pb-6 pr-7 text-[14px] leading-[1.8] text-muted">{answer}</p></details>)}</div></section>
      <section data-reveal className={`${reveal} border-y border-line bg-[radial-gradient(ellipse_at_bottom,#1c1c1c,#101010_65%)] py-[70px] text-center md:py-[105px]`}><div className={container}><p className={kicker}>Your next review starts at your counter</p><h2 className="mt-6 text-[clamp(2.25rem,4.8vw,4.0625rem)] font-normal leading-[1.14] tracking-[-.05em]">Give good experiences<br /><span className="display-heading text-muted">somewhere to go.</span></h2><div className="mt-6 flex flex-col items-center justify-center gap-2.5 md:mt-8 md:flex-row md:gap-6"><OrderLink>Get your Goreview card</OrderLink><a href={ORDER_EMAIL} className={textLink}>Email to order ↗</a></div><p className="mt-6 text-[13px] text-muted">One-time payment. Lifetime support.</p></div></section>
    </main>
    <footer className={`${container} flex flex-col gap-6 pb-[115px] pt-9 md:flex-row md:justify-between md:gap-10 md:py-11`}><div><a href="#" className="text-2xl font-semibold tracking-[-1.6px]">go<span className="font-normal">review</span>.</a><p className="mt-3 text-[12px] leading-[1.8] text-muted">By Helbi Solutions · Made for everyday businesses.</p></div><div className="text-left md:text-right"><a className="mr-6 text-[13px] md:mr-0 md:ml-6" href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">Facebook ↗</a><a className="text-[13px] md:ml-6" href={ORDER_EMAIL}>Email ↗</a><p className="mt-3 text-[12px] leading-[1.8] text-muted">Goreview is an independent product, not affiliated with Google.</p></div></footer>
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-line-strong bg-surface/95 px-5 py-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"><span className="text-[13px] text-muted">From <strong className="text-lg font-medium text-ink">₱699</strong><small className="mt-0.5 block text-[10px]">One-time · Lifetime support</small></span><OrderLink compact className="gap-2"><span>Get card</span></OrderLink></div>
  </div>;
}
