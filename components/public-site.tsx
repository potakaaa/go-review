import Link from "next/link";

import { FACEBOOK_URL, ORDER_EMAIL } from "@/lib/site";

const container = "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur-xl">
      <div
        className={`${container} flex h-[68px] items-center justify-between gap-4 md:h-[84px]`}
      >
        <Link
          href="/"
          className="text-2xl font-semibold tracking-[-1.6px] md:text-[27px]"
          aria-label="Goreview home"
        >
          go<span className="font-normal">review</span>
          <span className="text-muted">.</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-3 md:gap-7"
        >
          <Link
            className="hidden py-3.5 text-[13px] text-muted hover:text-ink sm:block"
            href="/google-review-card"
          >
            Google review cards
          </Link>
          <Link
            className="hidden py-3.5 text-[13px] text-muted hover:text-ink md:block"
            href="/guides"
          >
            Guides
          </Link>
          <Link
            className="hidden py-3.5 text-[13px] text-muted hover:text-ink lg:block"
            href="/resellers"
          >
            Resellers
          </Link>
          <Link
            className="py-3.5 text-[13px] text-muted hover:text-ink"
            href="/#pricing"
          >
            Pricing
          </Link>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ink bg-ink px-3 py-2 text-[12px] font-semibold text-canvas transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:min-h-11 sm:px-4 sm:py-2.5 sm:text-[14px]"
          >
            <span className="sm:hidden">Get card</span>
            <span className="hidden sm:inline">Get your card</span>
            <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer
      className={`${container} flex flex-col gap-6 pb-12 pt-9 md:flex-row md:justify-between md:gap-10 md:py-11`}
    >
      <div>
        <Link href="/" className="text-2xl font-semibold tracking-[-1.6px]">
          go<span className="font-normal">review</span>
          <span className="text-muted">.</span>
        </Link>
        <p className="mt-3 text-[12px] leading-[1.8] text-muted">
          By Helbi Solutions · Made for everyday businesses.
        </p>
      </div>
      <div className="text-left md:text-right">
        <a
          className="mr-6 text-[13px] md:mr-0 md:ml-6"
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Facebook ↗
        </a>
        <a className="text-[13px] md:ml-6" href={ORDER_EMAIL}>
          Email ↗
        </a>
        <Link className="ml-6 text-[13px]" href="/resellers">
          Resellers ↗
        </Link>
        <p className="mt-3 max-w-sm text-[12px] leading-[1.8] text-muted md:ml-auto">
          Goreview is an independent product, not affiliated with Google.
        </p>
      </div>
    </footer>
  );
}

export function PublicCta({
  title = "Make your next review easier to reach.",
  description = "Get a customized NFC and QR Google review card for your business.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="border-y border-line bg-[radial-gradient(ellipse_at_bottom,#1c1c1c,#101010_65%)] py-16 text-center md:py-24">
      <div className={container}>
        <p className="eyebrow">A simpler invitation</p>
        <h2 className="mt-5 text-[clamp(2.25rem,4.8vw,4.0625rem)] font-normal leading-[1.14] tracking-[-.05em]">
          {title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.8] text-muted md:text-[16px]">
          {description}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg border border-ink bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:-translate-y-0.5 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Get your Goreview card <span aria-hidden="true">↗</span>
          </a>
          <a
            href={ORDER_EMAIL}
            className="inline-flex min-h-12 items-center gap-3 px-2 py-3 text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Email to order <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="mt-5 text-[13px] text-muted">
          One-time payment. Lifetime support.
        </p>
      </div>
    </section>
  );
}
