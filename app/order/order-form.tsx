"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

import { submitOrderInquiry, type OrderFormState } from "@/app/order/actions";
import { PRESS, SETTLE } from "@/components/motion";
import { FormError } from "@/components/ui";
import {
  STANDEE_PRICE,
  TAP_CARD_MINIMUM,
  TAP_CARD_PRICE,
} from "@/lib/order-validation";

const FIELD =
  "w-full rounded-xl border border-line-strong bg-canvas px-4 py-3 text-base text-ink transition-colors duration-150 placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-offset-0 focus:outline-ink";

const PRODUCTS = [
  {
    key: "standee",
    name: "standee_quantity",
    label: "Google review standee",
    note: "Freestanding · NFC + QR",
    price: STANDEE_PRICE,
    image: "/images/goreview-standee-transparent-v3.png",
    width: 1094,
    height: 1438,
  },
  {
    key: "google",
    name: "google_card_quantity",
    label: "Google tap card",
    note: "3×4-inch adhesive",
    price: TAP_CARD_PRICE,
    image: "/images/google-tap-card-cutout.png",
    width: 900,
    height: 1200,
  },
  {
    key: "facebook",
    name: "facebook_card_quantity",
    label: "Facebook tap card",
    note: "3×4-inch adhesive",
    price: TAP_CARD_PRICE,
    image: "/images/facebook-tap-card-cutout.png",
    width: 900,
    height: 1200,
  },
  {
    key: "instagram",
    name: "instagram_card_quantity",
    label: "Instagram tap card",
    note: "3×4-inch adhesive",
    price: TAP_CARD_PRICE,
    image: "/images/instagram-tap-card-cutout.png",
    width: 900,
    height: 1200,
  },
] as const;

type ProductKey = (typeof PRODUCTS)[number]["key"];

const peso = (value: number) => `₱${value.toLocaleString("en-PH")}`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      disabled={pending}
      whileTap={pending ? undefined : PRESS}
      transition={SETTLE}
      className="min-h-13 w-full rounded-full bg-ink px-5 py-3.5 text-[0.9375rem] font-medium text-canvas transition-colors duration-200 hover:bg-brand-strong focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink disabled:opacity-55"
    >
      {pending ? "Sending inquiry…" : "Send order inquiry"}
    </motion.button>
  );
}

/**
 * A stepper rather than a bare number input. On a phone the spinner arrows of
 * `type=number` are either invisible or a hair wide, so the quantity becomes a
 * keyboard task; two 44px targets make it a thumb task. The real value still
 * travels in a hidden input under the name the server action expects.
 */
function Stepper({
  name,
  value,
  onChange,
  label,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const clamp = (next: number) => Math.min(100, Math.max(0, next));

  return (
    <div className="flex items-center gap-1 rounded-full border border-line-strong bg-canvas p-1">
      <input type="hidden" name={name} value={value} />
      <motion.button
        type="button"
        whileTap={PRESS}
        transition={SETTLE}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value === 0}
        aria-label={`Remove one ${label}`}
        className="grid size-9 place-items-center rounded-full text-lg text-ink transition-colors duration-150 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink disabled:opacity-30"
      >
        −
      </motion.button>
      <output
        aria-live="polite"
        aria-label={`${label} quantity`}
        className="w-7 text-center font-mono text-[0.9375rem] tabular-nums"
      >
        {value}
      </output>
      <motion.button
        type="button"
        whileTap={PRESS}
        transition={SETTLE}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value === 100}
        aria-label={`Add one ${label}`}
        className="grid size-9 place-items-center rounded-full text-lg text-ink transition-colors duration-150 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink disabled:opacity-30"
      >
        +
      </motion.button>
    </div>
  );
}

export function OrderForm() {
  const [state, action] = useActionState<OrderFormState, FormData>(
    submitOrderInquiry,
    {},
  );
  const [quantities, setQuantities] = useState<Record<ProductKey, number>>({
    standee: 0,
    google: 0,
    facebook: 0,
    instagram: 0,
  });
  const reduced = useReducedMotion();

  const tapCount = quantities.google + quantities.facebook + quantities.instagram;
  const total = useMemo(
    () => quantities.standee * STANDEE_PRICE + tapCount * TAP_CARD_PRICE,
    [quantities.standee, tapCount],
  );
  const belowMinimum = tapCount > 0 && tapCount < TAP_CARD_MINIMUM;

  if (state.status === "success") {
    return (
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SETTLE}
        className="rounded-2xl border border-ok/25 bg-ok-soft p-7 md:p-9"
      >
        <p className="eyebrow text-ok">Inquiry received</p>
        <h2 className="text-title mt-3">Thank you.</h2>
        <p className="mt-4 leading-7 text-muted">{state.message}</p>
        <p className="mt-6 text-[0.9375rem]">
          Reference:{" "}
          <strong className="font-mono">{state.reference}</strong>
        </p>
      </motion.div>
    );
  }

  return (
    <form action={action} className="space-y-10">
      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger"
        >
          {state.message}
        </p>
      ) : null}

      <section>
        <p className="eyebrow mb-4">1 — Choose products</p>
        <div className="grid gap-3">
          {PRODUCTS.map((product) => {
            const value = quantities[product.key];
            const chosen = value > 0;

            return (
              <div
                key={product.key}
                className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors duration-200 ${
                  chosen ? "border-ink bg-surface" : "border-line bg-canvas"
                }`}
              >
                <Image
                  src={product.image}
                  alt=""
                  aria-hidden="true"
                  width={product.width}
                  height={product.height}
                  sizes="52px"
                  className="h-13 w-auto shrink-0 object-contain"
                />
                <div className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-medium">
                    {product.label}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] text-subtle">
                    {product.note} · {peso(product.price)}
                  </span>
                </div>
                <Stepper
                  name={product.name}
                  label={product.label}
                  value={value}
                  onChange={(next) =>
                    setQuantities((current) => ({ ...current, [product.key]: next }))
                  }
                />
              </div>
            );
          })}
        </div>

        <p
          className={`mt-4 text-[0.875rem] ${belowMinimum ? "text-warn" : "text-muted"}`}
        >
          Tap cards have a minimum of {TAP_CARD_MINIMUM} total. Mix platforms
          however you like.
        </p>
        <FormError>{state.errors?.products}</FormError>

        <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
          <span className="text-[0.875rem] text-muted">Estimated product total</span>
          {/* Re-keyed on its own value, so a change reads as the number being
              replaced rather than silently rewritten. No exit animation: two
              figures crossfading over each other reads as a glitch. */}
          <motion.strong
            key={total}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SETTLE}
            className="text-[1.75rem] font-semibold tabular-nums tracking-[-0.02em]"
          >
            {peso(total)}
          </motion.strong>
        </div>
        <p className="mt-1 text-[0.75rem] text-subtle">
          Shipping outside CDO is quoted separately.
        </p>
      </section>

      <section className="space-y-5">
        <p className="eyebrow">2 — Your details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["customer_name", "Your name", "name"],
              ["business_name", "Business name", "organization"],
              ["mobile", "Mobile number", "tel"],
              ["email", "Email (optional)", "email"],
              ["city", "City / municipality", "address-level2"],
              ["barangay", "Barangay", "address-level3"],
            ] as const
          ).map(([name, label, autoComplete]) => (
            <label key={name} className="block">
              <span className="mb-2 block text-[0.875rem] font-medium">{label}</span>
              <input
                name={name}
                required={name !== "email"}
                autoComplete={autoComplete}
                defaultValue={state.values?.[name]}
                aria-invalid={state.errors?.[name] ? true : undefined}
                className={FIELD}
              />
              <FormError>{state.errors?.[name]}</FormError>
            </label>
          ))}
        </div>

        <fieldset>
          <legend className="mb-2 text-[0.875rem] font-medium">
            Preferred contact
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["mobile", "Mobile"],
                ["email", "Email"],
              ] as const
            ).map(([value, label], index) => (
              <label
                key={value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-canvas px-4 text-[0.9375rem] transition-colors duration-150 has-checked:border-ink has-checked:bg-surface"
              >
                <input
                  type="radio"
                  name="preferred_contact"
                  value={value}
                  defaultChecked={index === 0}
                  className="accent-ink"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[0.875rem] font-medium">Delivery area</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["cdo", "Within CDO"],
                ["outside_cdo", "Outside CDO"],
              ] as const
            ).map(([value, label], index) => (
              <label
                key={value}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-canvas px-4 text-[0.9375rem] transition-colors duration-150 has-checked:border-ink has-checked:bg-surface"
              >
                <input
                  type="radio"
                  name="delivery_area"
                  value={value}
                  defaultChecked={index === 0}
                  className="accent-ink"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-[0.875rem] font-medium">
            Notes <span className="text-subtle">(optional)</span>
          </span>
          <textarea
            name="customer_notes"
            rows={4}
            defaultValue={state.values?.customer_notes}
            placeholder="Preferred color, deadline, or questions"
            className={FIELD}
          />
        </label>
      </section>

      <div className="rounded-xl border border-line bg-surface p-4 text-[0.75rem] leading-6 text-muted">
        No payment is taken here. We&rsquo;ll contact you to confirm the order,
        complete delivery address, shipping if needed, and payment details. By
        submitting, you agree to our{" "}
        <a href="/privacy" className="text-ink underline underline-offset-2">
          privacy notice
        </a>
        .
      </div>

      <SubmitButton />
    </form>
  );
}
