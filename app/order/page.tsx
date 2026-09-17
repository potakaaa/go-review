import type { Metadata } from "next";
import { OrderForm } from "@/app/order/order-form";
import { PublicFooter, PublicHeader } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Order a Google review standee or tap cards",
  description:
    "Start with the Goreview Google review standee, or add Google, Facebook, and Instagram tap cards for walls, tables, and counters.",
};

export default function OrderPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-[calc(100%-2.5rem)] max-w-3xl py-14 md:py-20">
        <p className="eyebrow">Order inquiry</p>
        <h1 className="mt-4 text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.96] tracking-[-0.06em]">
          Start with the standee.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
          Choose the ₱699 Google review standee, then add ₱299 tap cards if you
          want a card on another surface or for another platform. Card orders
          have a minimum of three total, with free delivery within CDO.
        </p>
        <div className="mt-10 rounded-2xl border border-line bg-canvas p-5 shadow-sm md:p-8">
          <OrderForm />
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
