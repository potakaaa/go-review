"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type SpringOptions,
  type Transition,
} from "motion/react";
import type { ComponentProps, ReactNode } from "react";

/**
 * React's drag and animation DOM handlers collide with motion's props of the
 * same name, so they are dropped from the wrappers below. Nothing here drags
 * via the native HTML5 API.
 */
type WithoutMotionConflicts<T> = Omit<
  T,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
>;

/**
 * Shared motion for the public site.
 *
 * SETTLE is critically damped -- Apple's damping 1.0, response ~0.4 -- and is
 * the default for anything that simply arrives. Overshoot on something the
 * user did not push reads as decoration; bounce is earned by a gesture that
 * carried momentum, and nothing here drags yet.
 *
 * Every spring starts from the element's live on-screen value, so an animation
 * caught mid-flight redirects from where it actually is rather than jumping to
 * where it logically was.
 */
export const SETTLE: Transition = { type: "spring", bounce: 0, duration: 0.45 };

/** The same critically damped curve, shaped for `useSpring`, which takes
 *  SpringOptions rather than a full Transition. */
const SETTLE_SPRING: SpringOptions = { bounce: 0, duration: 0.5 };

/** Press feedback belongs on pointer-down. Waiting for the click feels dead. */
export const PRESS = { scale: 0.975 } as const;

const MotionLink = motion.create(Link);

/**
 * Scroll reveal. Under reduced motion the travel is dropped and only the
 * cross-fade remains -- gentler, not absent.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -8% 0px" }}
      transition={{ ...SETTLE, delay }}
    >
      {children}
    </Tag>
  );
}

/**
 * A group of items that arrive in sequence. The gap is deliberately short --
 * long staggers turn a list into a performance the reader has to wait out.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ol" | "ul";
}) {
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  y = 20,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  /** `li` matters: an ordered list may only contain list items. */
  as?: "div" | "li" | "article";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : y },
        shown: { opacity: 1, y: 0, transition: SETTLE },
      }}
    >
      {children}
    </Tag>
  );
}

/** A link that responds the instant it is pressed. */
export function PressLink({
  className,
  children,
  ...props
}: WithoutMotionConflicts<ComponentProps<typeof Link>>) {
  return (
    <MotionLink className={className} whileTap={PRESS} transition={SETTLE} {...props}>
      {children}
    </MotionLink>
  );
}

/** The anchor equivalent, for mailto: and external destinations. */
export function PressAnchor({
  className,
  children,
  ...props
}: WithoutMotionConflicts<ComponentProps<"a">>) {
  return (
    <motion.a className={className} whileTap={PRESS} transition={SETTLE} {...props}>
      {children}
    </motion.a>
  );
}

/**
 * Pointer-tracked tilt for the product cutouts.
 *
 * The rotation follows the pointer 1:1 through a spring, so moving away and
 * back never snaps -- and because the spring holds velocity, letting go
 * mid-sweep settles instead of stopping dead. Touch pointers are ignored:
 * on a phone the finger covers the thing it would be tilting.
 */
export function TiltStage({
  children,
  className = "",
  strength = 8,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const sx = useSpring(px, SETTLE_SPRING);
  const sy = useSpring(py, SETTLE_SPRING);

  const rotateY = useTransform(sx, [-0.5, 0.5], [-strength, strength]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [strength * 0.8, -strength * 0.8]);

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: 1200 }}
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const box = event.currentTarget.getBoundingClientRect();
        px.set((event.clientX - box.left) / box.width - 0.5);
        py.set((event.clientY - box.top) / box.height - 0.5);
      }}
      onPointerLeave={() => {
        px.set(0);
        py.set(0);
      }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Scroll-linked drift. The element moves a little slower than the page, which
 * reads as depth without becoming a full-viewport moving background.
 */
export function ParallaxLayer({
  children,
  className = "",
  distance = 40,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const raw = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(raw, SETTLE_SPRING);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/**
 * A glass surface that materialises rather than fading: blur and scale move
 * together so it reads as a real material arriving.
 */
export function Materialize({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, scale: 0.96, filter: "blur(12px)" }
      }
      whileInView={
        reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.25 }}
      transition={{ ...SETTLE, delay }}
    >
      {children}
    </motion.div>
  );
}
