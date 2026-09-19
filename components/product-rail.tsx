"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { PRESS, PressLink, SETTLE } from "@/components/motion";
import {
  DUO_STANDEE_PRICE,
  STANDEE_PRICE,
  TAP_CARD_PRICE,
} from "@/lib/order-validation";

/**
 * Every product on one shelf.
 *
 * A rail rather than a grid: the catalogue is now long enough that a grid
 * either wraps into a wall of equal-weight boxes or forces the page to pick
 * three winners. A rail keeps the whole range in one gesture, keeps the
 * flagship first, and stays a single row on a phone -- which is where most of
 * these orders start.
 *
 * It is a native scroll container with snap points. Nothing here reimplements
 * momentum, so a trackpad flick, a swipe and Shift+wheel all behave the way
 * the platform already does; the arrow buttons only exist for a mouse, which
 * has no gesture for sideways.
 */
type Product = {
  name: string;
  tag: string;
  price: number;
  priceNote: string;
  copy: string;
  href: string;
  linkLabel: string;
  image: string;
  width: number;
  height: number;
  isNew?: boolean;
};

const PRODUCTS: Product[] = [
  {
    name: "Google review standee",
    tag: "Flagship",
    price: STANDEE_PRICE,
    priceNote: "one-time",
    copy: "The freestanding NFC and QR display for your Google review link. Made for a counter or reception desk.",
    href: "/google-review-card",
    linkLabel: "View the standee",
    image: "/images/goreview-standee-transparent-v3.png",
    width: 1094,
    height: 1438,
  },
  {
    name: "Facebook + Google Maps standee",
    tag: "2-in-1",
    price: DUO_STANDEE_PRICE,
    priceNote: "one-time",
    copy: "One standee, two platforms. Customers tap or scan to follow and review on Facebook, or review on Google Maps.",
    href: "/order",
    linkLabel: "Order the 2-in-1",
    image: "/images/duo-review-standee-cutout.webp",
    width: 778,
    height: 585,
    isNew: true,
  },
  {
    name: "Google tap card",
    tag: "3×4-inch card",
    price: TAP_CARD_PRICE,
    priceNote: "per card",
    copy: "A wall, table, or counter card that opens your Google review link.",
    href: "/google-tap-card",
    linkLabel: "View Google card",
    image: "/images/google-tap-card-cutout.png",
    width: 900,
    height: 1200,
  },
  {
    name: "Facebook tap card",
    tag: "3×4-inch card",
    price: TAP_CARD_PRICE,
    priceNote: "per card",
    copy: "Invite customers to your Facebook Page and review flow.",
    href: "/facebook-tap-card",
    linkLabel: "View Facebook card",
    image: "/images/facebook-tap-card-cutout.png",
    width: 900,
    height: 1200,
  },
  {
    name: "Instagram tap card",
    tag: "3×4-inch card",
    price: TAP_CARD_PRICE,
    priceNote: "per card",
    copy: "Make your Instagram profile easy to find and follow.",
    href: "/instagram-tap-card",
    linkLabel: "View Instagram card",
    image: "/images/instagram-tap-card-cutout.png",
    width: 900,
    height: 1200,
  },
];

const peso = (value: number) => `₱${value.toLocaleString("en-PH")}`;

function Arrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : PRESS}
      transition={SETTLE}
      aria-label={direction === "left" ? "Previous products" : "Next products"}
      className="grid size-11 place-items-center rounded-full border border-line-strong bg-canvas text-ink transition-colors duration-200 hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-30"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {direction === "left" ? "←" : "→"}
      </span>
    </motion.button>
  );
}

export function ProductRail() {
  const scroller = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const reduced = useReducedMotion();

  const measure = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    // A one-pixel tolerance: fractional scroll widths mean `scrollLeft` at the
    // far end often lands just short of the arithmetic maximum.
    const remaining = element.scrollWidth - element.clientWidth - element.scrollLeft;
    setAtStart(element.scrollLeft <= 1);
    setAtEnd(remaining <= 1);
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure]);

  // Page by whatever is actually on screen rather than a fixed card count, so
  // one press never jumps past a card at an in-between width.
  const page = (direction: 1 | -1) => {
    const element = scroller.current;
    if (!element) return;
    const card = element.querySelector("li");
    const step = card ? card.clientWidth + 16 : element.clientWidth * 0.8;
    element.scrollBy({
      left: direction * step,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-[0.875rem] text-subtle">
          {PRODUCTS.length} products · swipe or scroll
        </p>
        {/* Pointer-only. A touch device already has the gesture, and a second
            way to do the same thing is just more to skip past. */}
        <div className="hidden gap-2 md:flex">
          <Arrow direction="left" disabled={atStart} onClick={() => page(-1)} />
          <Arrow direction="right" disabled={atEnd} onClick={() => page(1)} />
        </div>
      </div>

      <ul
        ref={scroller}
        onScroll={measure}
        // Full-bleed: the rail runs to the window edge and the gutter becomes
        // scroll padding, so a card is clipped by the screen rather than by an
        // invisible box inset from it -- the clip is the affordance.
        className="rail-scroller -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 md:-mx-7 md:px-7 xl:-mx-12 xl:px-12"
        style={{ scrollPaddingInline: "1.25rem" }}
      >
        {PRODUCTS.map((product) => (
          <li
            key={product.name}
            className="w-[15.5rem] shrink-0 snap-start sm:w-[17.5rem]"
          >
            <article className="flex h-full flex-col rounded-2xl border border-line bg-canvas p-5 transition-colors duration-200 hover:border-line-strong">
              <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-surface">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={product.width}
                  height={product.height}
                  sizes="(max-width: 639px) 15.5rem, 17.5rem"
                  // An explicit height rather than `h-full`: a percentage
                  // height on an auto-width image inside the fixed-height
                  // frame resolves against an indefinite basis, so the image
                  // overflows and is silently cropped.
                  className="max-h-30 w-auto max-w-full object-contain drop-shadow-[0_10px_18px_rgb(29_29_31/16%)]"
                />
                {product.isNew ? (
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-ink px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.04em] text-canvas uppercase">
                    New
                  </span>
                ) : null}
              </div>

              <p className="eyebrow mt-5">{product.tag}</p>
              <h3 className="mt-2 text-[1.0625rem] leading-6 font-semibold text-balance">
                {product.name}
              </h3>
              <p className="mt-2 text-[0.875rem] leading-6 text-muted">
                {product.copy}
              </p>

              {/* mt-auto: price and link share a baseline across every card,
                  however many lines the copy above them runs to. */}
              <div className="mt-auto flex items-baseline gap-2 pt-5">
                <strong className="text-[1.375rem] font-semibold tracking-[-0.02em] tabular-nums">
                  {peso(product.price)}
                </strong>
                <span className="text-[0.8125rem] text-subtle">
                  {product.priceNote}
                </span>
              </div>
              <PressLink
                href={product.href}
                className="group mt-3 inline-flex min-h-11 items-center gap-1.5 text-[0.875rem] font-medium text-ink transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
              >
                {product.linkLabel}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </PressLink>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
