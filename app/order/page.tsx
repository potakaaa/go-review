import type { Metadata } from "next";

import { OrderForm } from "@/app/order/order-form";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  publicUrl,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Order a Google review standee or tap cards",
  description:
    "Order the Goreview Google review standee, the 2-in-1 Facebook and Google Maps standee, or Google, Facebook, and Instagram tap cards.",
  alternates: { canonical: publicUrl("/order") },
};

export default function OrderPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd,
          websiteJsonLd,
          webPageJsonLd({
            path: "/order",
            name: "Order a Google review standee or tap cards",
            description:
              "Send an order inquiry for the Goreview standee, the 2-in-1 standee, or Google, Facebook, and Instagram tap cards.",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Order", path: "/order" },
          ]),
        ]}
      />
      <PublicHeader />

      <main className="pb-20 md:pb-28">
        <div className="mx-auto w-[calc(100%-2.5rem)] max-w-3xl py-12 md:py-16">
          <p className="eyebrow">Order inquiry</p>
          <h1 className="text-display mt-4">Start with the standee.</h1>
          <p className="text-body-lg mt-5 max-w-2xl text-muted">
            Choose the ₱699 Google review standee or the ₱999 2-in-1 Facebook
            and Google Maps standee, then add ₱299 tap cards if you want
            another surface or platform. Card orders have a minimum of three
            total, with free delivery within CDO.
          </p>

          <div className="mt-10 rounded-3xl border border-line bg-surface p-5 md:p-8">
            <OrderForm />
          </div>

          <section className="mt-16 border-t border-line pt-10">
            <h2 className="text-subtitle">What happens after you send this?</h2>
            <p
              data-speakable
              className="mt-4 text-[1.0625rem] leading-[1.75] text-muted"
            >
              Nothing is charged and nothing is printed yet. This form is an
              inquiry, not a checkout. We reply with a confirmation of your
              quantities, artwork, destinations, delivery, and payment details,
              and production only starts once you have agreed to all of it.
            </p>
            <ol className="mt-7 space-y-5 text-[1.0625rem] leading-[1.75] text-muted">
              <li className="grid grid-cols-[2.25rem_1fr] gap-4">
                <span className="font-mono text-[0.75rem] text-subtle">01</span>
                <span>
                  <strong className="block font-semibold text-ink">You send the inquiry</strong>
                  Tell us the products, quantities, your business name, and
                  where the cards should point.
                </span>
              </li>
              <li className="grid grid-cols-[2.25rem_1fr] gap-4">
                <span className="font-mono text-[0.75rem] text-subtle">02</span>
                <span>
                  <strong className="block font-semibold text-ink">We confirm the details</strong>
                  We reply with artwork, a delivery estimate, and payment
                  instructions. Ask for changes here — it costs nothing yet.
                </span>
              </li>
              <li className="grid grid-cols-[2.25rem_1fr] gap-4">
                <span className="font-mono text-[0.75rem] text-subtle">03</span>
                <span>
                  <strong className="block font-semibold text-ink">We print and ship</strong>
                  Cards are configured to your destinations before they leave,
                  so they work the moment they arrive.
                </span>
              </li>
            </ol>

            <h2 className="text-subtitle mt-12">Can you change an order later?</h2>
            <p className="mt-4 text-[1.0625rem] leading-[1.75] text-muted">
              Quantities and artwork can change any time before you confirm.
              After printing, the physical card is fixed, but where it points is
              not — the printed Goreview link stays the same for the life of the
              card while authorized staff can update its destination. A card
              already sitting on a counter follows the change.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
