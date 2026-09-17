"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

import { SETTLE } from "@/components/motion";

/**
 * The three tap cards held like a hand of cards: two peeking out behind, the
 * Google card square to the front.
 *
 * Every card pivots about a point below its own bottom edge, which is what
 * makes a real fan splay rather than just shear sideways -- the tops separate
 * while the bottoms stay gathered. Sizes and offsets are all derived from one
 * `--card-w`, so the whole arrangement scales as a unit on a phone.
 *
 * Decorative: the three platform links live in the columns directly below, so
 * this is hidden from assistive tech rather than duplicating them.
 */
const FAN = [
  {
    src: "/images/facebook-tap-card-cutout.png",
    platform: "Facebook",
    rest: { rotate: -16, x: "-46%", y: "4%" },
    spread: { rotate: -25, x: "-74%", y: "-2%" },
  },
  {
    src: "/images/instagram-tap-card-cutout.png",
    platform: "Instagram",
    rest: { rotate: 16, x: "46%", y: "4%" },
    spread: { rotate: 25, x: "74%", y: "-2%" },
  },
  // Last in the DOM, so it stacks in front without needing a z-index.
  {
    src: "/images/google-tap-card-cutout.png",
    platform: "Google",
    rest: { rotate: 0, x: "0%", y: "-2%" },
    spread: { rotate: 0, x: "0%", y: "-7%" },
  },
] as const;

export function CardFan() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="relative mx-auto flex w-full max-w-[37rem] items-center justify-center"
      // One knob drives card size, stage size and every offset below it.
      style={{ ["--card-w" as string]: "clamp(8rem, 24vw, 12rem)" }}
    >
      {/* The colour the glass refracts. Sitting behind the panel and spilling
          past its edges is what stops the material reading as a white box. */}
      <div className="brand-glow pointer-events-none absolute h-[calc(var(--card-w)*2.3)] w-[calc(var(--card-w)*3.9)] rounded-[50%]" />

      <motion.div
        initial="rest"
        animate="rest"
        whileHover={reduced ? undefined : "spread"}
        className="glass glass-sheen relative flex h-[calc(var(--card-w)*1.98)] w-full items-center justify-center rounded-[2.25rem]"
      >
        {FAN.map((card) => (
          <motion.div
            key={card.platform}
            className="absolute w-[var(--card-w)]"
            // Pivot below the card so the tops splay and the bottoms gather.
            style={{ transformOrigin: "50% 155%" }}
            variants={{ rest: card.rest, spread: reduced ? card.rest : card.spread }}
            transition={SETTLE}
          >
            <Image
              src={card.src}
              alt=""
              width={900}
              height={1200}
              sizes="(max-width: 767px) 30vw, 190px"
              className="h-auto w-full object-contain drop-shadow-[0_14px_24px_rgb(29_29_31/26%)]"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
