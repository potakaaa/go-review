import type { Metadata } from "next";
import { OrderForm } from "@/app/order/order-form";
import { PublicFooter, PublicHeader } from "@/components/public-site";

export const metadata: Metadata = { title: "Order tap cards", description: "Order Goreview Google, Facebook, and Instagram tap cards in the Philippines." };

export default function OrderPage() {
  return <><PublicHeader /><main className="mx-auto w-[calc(100%-2.5rem)] max-w-3xl py-14 md:py-20"><p className="eyebrow">Order inquiry</p><h1 className="mt-4 text-[clamp(2.75rem,7vw,5.5rem)] leading-[.96] tracking-[-.06em]">Build your tap-card set.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-muted">Choose Google, Facebook, or Instagram cards—or mix all three. Tap cards are ₱299 each with a minimum of three. Free delivery within CDO.</p><div className="mt-10 rounded-2xl border border-line bg-canvas p-5 shadow-sm md:p-8"><OrderForm /></div></main><PublicFooter /></>;
}
