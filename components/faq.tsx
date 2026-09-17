"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { SETTLE } from "@/components/motion";

/**
 * An accordion rather than <details>, because a native disclosure cannot
 * animate its own height -- the panel would appear fully formed with no sense
 * of where it came from. The panel grows from the row that opened it and
 * collapses back along the same path.
 */
export function Faq({
  items,
}: {
  items: ReadonlyArray<readonly [question: string, answer: string]>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const baseId = useId();
  const reduced = useReducedMotion();

  return (
    <div className="border-t border-line">
      {items.map(([question, answer], index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div key={question} className="border-b border-line">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-[1rem] font-medium text-ink transition-colors duration-150 hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {question}
                <motion.span
                  aria-hidden="true"
                  animate={{ rotate: open ? 45 : 0 }}
                  transition={SETTLE}
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-lg font-normal text-muted"
                >
                  +
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  key="panel"
                  initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={SETTLE}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-6 text-[0.9375rem] leading-7 text-muted">
                    {answer}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
