import type { Metadata } from "next";

import { PublicFooter, PublicHeader } from "@/components/public-site";

export const metadata: Metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-[calc(100%-2.5rem)] max-w-[46rem] py-14 md:py-20">
        <p className="eyebrow">Privacy</p>
        <h1 className="text-title mt-4">Order inquiry privacy notice</h1>
        <div className="mt-8 space-y-6 text-[1.0625rem] leading-[1.75] text-muted">
          <p>
            Goreview collects the contact, business, location, and product
            details you submit so we can reply, prepare your order, arrange
            delivery, and provide support.
          </p>
          <p>
            Order inquiries are visible only to authorized Goreview staff and
            the service providers needed to host the form and send its internal
            notification. We do not sell your information.
          </p>
          <p>
            We keep order records for operations and support. Inquiries that do
            not become orders may be deleted after 12 months. You may ask us to
            correct or delete eligible information by emailing{" "}
            <a className="text-ink underline underline-offset-2" href="mailto:helbirog@gmail.com">
              helbirog@gmail.com
            </a>
            .
          </p>
          <p>
            We ask only for your city and barangay online. Your complete
            delivery address is collected later when staff confirms the order.
          </p>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
