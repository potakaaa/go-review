import type { Metadata } from "next";

import { OrderForm } from "@/app/order/order-form";
import { PublicFooter, PublicHeader } from "@/components/public-site";
import { publicUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Order a Google review standee or tap cards",
  description:
    "Order the Goreview Google review standee, the 2-in-1 Facebook and Google Maps standee, or Google, Facebook, and Instagram tap cards.",
  alternates: { canonical: publicUrl("/order") },
};

export default function OrderPage() {
  return (
    <>
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
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
