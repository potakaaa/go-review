"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "motion/react";

import { PressAnchor, PressLink, SETTLE } from "@/components/motion";
import { container, primaryButton, secondaryButton } from "@/components/styles";
import { FACEBOOK_URL, ORDER_EMAIL } from "@/lib/site";

const NAV = [
  { href: "/google-review-card", label: "Google standee" },
  { href: "/#products", label: "All products" },
  { href: "/guides", label: "Guides" },
  { href: "/resellers", label: "Resellers" },
  { href: "/#pricing", label: "Pricing" },
] as const;

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-[1.375rem] font-semibold tracking-[-0.035em] ${className}`}>
      go<span className="font-normal">review</span>
      <span className="text-muted">.</span>
    </span>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  // Two bars that rotate into a cross. The bars are the same elements
  // throughout, so the shape transforms rather than swapping.
  return (
    <span aria-hidden="true" className="relative block h-4 w-5">
      <motion.span
        className="absolute left-0 block h-px w-5 bg-ink"
        animate={open ? { top: 8, rotate: 45 } : { top: 4, rotate: 0 }}
        transition={SETTLE}
      />
      <motion.span
        className="absolute left-0 block h-px w-5 bg-ink"
        animate={open ? { top: 8, rotate: -45 } : { top: 11, rotate: 0 }}
        transition={SETTLE}
      />
    </span>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();

  // The bar is part of the page until the page moves under it, then it
  // becomes a floating material. Threshold, not a continuous fade, so the
  // material does not shimmer on every scroll pixel.
  useMotionValueEvent(scrollY, "change", (value) => {
    setLifted(value > 12);
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        className="absolute inset-0 -z-10 border-b"
        initial={false}
        animate={{ opacity: lifted || open ? 1 : 0 }}
        transition={SETTLE}
        style={{
          background: "var(--glass-tint-strong)",
          borderColor: "var(--color-line)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
        }}
      />

      <div className={`${container} flex h-[64px] items-center justify-between gap-4 md:h-[72px]`}>
        <Link
          href="/"
          aria-label="Goreview home"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <div className="hidden items-center lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-[0.8125rem] text-muted transition-colors duration-200 hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <PressLink href="/order" className={`${primaryButton} ml-2 h-10 min-h-10 px-4 text-sm`}>
            Order
          </PressLink>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="ml-1 flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-200 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            className="lg:hidden"
            // Anchored to the button that opened it, so the panel grows out of
            // its trigger rather than appearing from nowhere.
            style={{ transformOrigin: "top right" }}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
            transition={SETTLE}
          >
            <div className={`${container} pb-4`}>
              <div className="glass glass-sheen overflow-hidden rounded-2xl">
                <ul className="relative z-10 p-2">
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex min-h-12 items-center rounded-xl px-4 text-[0.9375rem] font-medium text-ink transition-colors duration-150 hover:bg-canvas/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className={`${container} flex flex-col gap-8 py-12 md:flex-row md:justify-between md:gap-10 md:py-14`}>
        <div>
          <Link href="/" className="inline-block">
            <Wordmark />
          </Link>
          <p className="mt-3 max-w-xs text-[0.8125rem] leading-6 text-muted">
            By Helbi Solutions · Made for everyday businesses.
          </p>
        </div>

        <div className="md:text-right">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end">
            {[
              { href: FACEBOOK_URL, label: "Facebook", external: true },
              { href: ORDER_EMAIL, label: "Email", external: true },
              { href: "/resellers", label: "Resellers", external: false },
              { href: "/guides", label: "Guides", external: false },
              { href: "/privacy", label: "Privacy", external: false },
            ].map((item) =>
              item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="py-1 text-[0.8125rem] text-muted transition-colors hover:text-ink"
                >
                  {item.label} ↗
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="py-1 text-[0.8125rem] text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <p className="mt-4 max-w-sm text-[0.75rem] leading-6 text-subtle md:ml-auto">
            Goreview is independent and is not affiliated with Google, Meta,
            Facebook, or Instagram.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function PublicCta({
  title = "Put your next action within reach.",
  description = "Start with the Google review standee, then add adhesive tap cards for other surfaces or platforms.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="border-t border-line bg-surface py-20 md:py-28">
      <div className={`${container} text-center`}>
        <p className="eyebrow">A simpler invitation</p>
        <h2 className="text-title mx-auto mt-4 max-w-3xl text-balance">{title}</h2>
        <p className="text-body-lg mx-auto mt-5 max-w-xl text-muted">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PressLink href="/order" className={`${primaryButton} min-h-12 px-7`}>
            Build your order
          </PressLink>
          <PressAnchor href={ORDER_EMAIL} className={`${secondaryButton} min-h-12 px-7`}>
            Email to order
          </PressAnchor>
        </div>
        <p className="mt-6 text-[0.8125rem] text-subtle">
          Google standee ₱699 · 2-in-1 Facebook + Google Maps standee ₱999 ·
          Tap cards ₱299 each, minimum three
        </p>
      </div>
    </section>
  );
}
