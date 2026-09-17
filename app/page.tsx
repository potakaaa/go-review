import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import { organizationJsonLd, websiteJsonLd, webPageJsonLd } from "@/lib/seo";
import { PUBLIC_ORIGIN } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Google, Facebook & Instagram Tap Cards | Goreview" },
  description: "NFC and QR tap cards for Google reviews, Facebook, and Instagram. 3×4-inch adhesive cards from ₱299 in the Philippines.",
  alternates: { canonical: PUBLIC_ORIGIN },
};

const cards = [
  { platform: "Google", image: "/images/google-tap-card-mockup-v1.png", copy: "Open your Google review screen.", href: "/google-review-card" },
  { platform: "Facebook", image: "/images/facebook-tap-card-mockup-v1.png", copy: "Open your Facebook Page or reviews.", href: "/facebook-tap-card" },
  { platform: "Instagram", image: "/images/instagram-tap-card-mockup-v1.png", copy: "Open your Instagram profile.", href: "/instagram-tap-card" },
];

const faqs = [
  ["Can I mix platforms?", "Yes. The three-card minimum can be any mix of Google, Facebook, and Instagram tap cards."],
  ["How do people use a card?", "They tap an NFC-enabled phone or scan the printed QR code. The selected profile or review destination opens directly."],
  ["Is delivery free?", "Delivery is free within Cagayan de Oro for orders that meet the three-card minimum. We quote shipping separately outside CDO."],
  ["Do I pay online?", "No. The order form sends an inquiry. We confirm availability, delivery, payment, and your complete address with you directly."],
];

export default function Home() {
  return <div><JsonLd data={[organizationJsonLd, websiteJsonLd, webPageJsonLd({ path: "/", name: "Goreview tap cards", description: "NFC and QR tap cards for Google, Facebook, and Instagram." })]} /><PublicHeader /><main>
    <section className="mx-auto grid min-h-[680px] w-[calc(100%-2.5rem)] max-w-[1180px] items-center gap-10 py-14 md:grid-cols-[.9fr_1.1fr] md:py-20">
      <div><p className="eyebrow">One tap to the right place</p><h1 className="mt-5 text-[clamp(3.2rem,8vw,6.8rem)] font-medium leading-[.9] tracking-[-.07em]">Turn real-world moments into <span className="display-heading text-muted">online action.</span></h1><p className="mt-7 max-w-lg text-base leading-8 text-muted md:text-lg">Put Google reviews, your Facebook Page, or your Instagram profile within one tap—or one scan—of your customers.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/order" className="inline-flex min-h-12 items-center rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas">Build your order <span className="ml-3">↗</span></Link><a href="#cards" className="inline-flex min-h-12 items-center px-4 text-sm font-medium">See the cards ↓</a></div><p className="mt-5 text-xs text-subtle">3×4-inch adhesive tap cards · ₱299 each · minimum 3</p></div>
      <div className="relative grid grid-cols-3 items-center gap-2"><Image src={cards[1].image} alt="Facebook tap card held in a hand" width={1254} height={1254} className="-rotate-6 rounded-xl shadow-2xl" priority /><Image src={cards[0].image} alt="Google review tap card held in a hand" width={1254} height={1254} className="relative z-10 scale-110 rounded-xl shadow-2xl" priority /><Image src={cards[2].image} alt="Instagram tap card held in a hand" width={1254} height={1254} className="rotate-6 rounded-xl shadow-2xl" priority /></div>
    </section>

    <section id="cards" className="border-y border-line bg-surface py-16 md:py-24"><div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px]"><div className="max-w-3xl"><p className="eyebrow">Choose the destination</p><h2 className="mt-4 text-[clamp(2.5rem,6vw,5rem)] leading-[.95] tracking-[-.06em]">One card. One clear next step.</h2><p className="mt-5 text-base leading-8 text-muted">Each physical card is set to one platform, so customers go exactly where you intend.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{cards.map((card) => <article key={card.platform} className="overflow-hidden rounded-2xl border border-line bg-canvas"><Image src={card.image} alt={`${card.platform} NFC and QR tap card`} width={1254} height={1254} className="aspect-square w-full object-cover" /><div className="p-5"><div className="flex items-baseline justify-between"><h3 className="text-xl font-medium">{card.platform}</h3><strong>₱299</strong></div><p className="mt-3 text-sm leading-6 text-muted">{card.copy}</p><Link href={card.href} className="mt-5 inline-flex text-sm font-medium underline underline-offset-4">View {card.platform} card →</Link></div></article>)}</div><div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-line-strong bg-elevated p-6 md:flex-row md:items-center"><div><strong className="text-lg">Mix any three or more.</strong><p className="mt-1 text-sm text-muted">Free delivery within CDO. Nationwide shipping available.</p></div><Link href="/order" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-canvas">Choose quantities</Link></div></div></section>

    <section className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1180px] gap-10 py-16 md:grid-cols-2 md:py-24"><div><p className="eyebrow">Need a countertop display?</p><h2 className="mt-4 text-5xl leading-none tracking-[-.055em]">The original Google review standee.</h2><p className="mt-5 max-w-lg text-base leading-8 text-muted">A freestanding NFC and QR display customized and configured for your business. Ideal for counters and reception desks.</p><p className="mt-7 text-4xl font-medium">₱699</p><p className="mt-1 text-xs text-subtle">One-time payment · Lifetime support</p><Link href="/order" className="mt-7 inline-flex min-h-12 items-center rounded-lg border border-line-strong px-6 py-3 text-sm font-semibold">Add a standee</Link></div><div className="rounded-2xl border border-line bg-surface p-8"><ol className="space-y-8">{[["01","Choose","Pick quantities and platforms."],["02","We confirm","We contact you for setup, delivery, and payment."],["03","Place and tap","Stick or stand the finished card where customers naturally pause."]].map(([number,title,copy]) => <li key={number} className="grid grid-cols-[3rem_1fr] gap-3 border-b border-line pb-7 last:border-0 last:pb-0"><span className="font-mono text-xs text-subtle">{number}</span><span><strong className="block">{title}</strong><span className="mt-2 block text-sm leading-6 text-muted">{copy}</span></span></li>)}</ol></div></section>

    <section className="border-y border-line bg-surface py-16 md:py-24"><div className="mx-auto grid w-[calc(100%-2.5rem)] max-w-[1000px] gap-10 md:grid-cols-[.75fr_1.25fr]"><div><p className="eyebrow">Good questions</p><h2 className="mt-4 text-5xl tracking-[-.055em]">Before you order.</h2></div><div>{faqs.map(([question, answer]) => <details key={question} className="group border-t border-line last:border-b"><summary className="flex cursor-pointer list-none justify-between gap-4 py-5 font-medium">{question}<span className="text-muted group-open:rotate-45">+</span></summary><p className="pb-6 text-sm leading-7 text-muted">{answer}</p></details>)}</div></div></section>

    <section className="mx-auto w-[calc(100%-2.5rem)] max-w-[900px] py-20 text-center md:py-28"><p className="eyebrow">Ready when you are</p><h2 className="mt-5 text-[clamp(2.8rem,7vw,5.5rem)] leading-[.95] tracking-[-.06em]">Put your next action within reach.</h2><Link href="/order" className="mt-8 inline-flex min-h-12 items-center rounded-lg bg-ink px-7 py-3 text-sm font-semibold text-canvas">Start an order inquiry ↗</Link></section>
  </main><PublicFooter /></div>;
}
