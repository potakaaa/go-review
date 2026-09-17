"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitOrderInquiry, type OrderFormState } from "@/app/order/actions";
import { FormError } from "@/components/ui";
import { STANDEE_PRICE, TAP_CARD_MINIMUM, TAP_CARD_PRICE } from "@/lib/order-validation";

const FIELD = "w-full rounded-lg border border-line-strong bg-elevated px-4 py-3 text-base text-ink placeholder:text-subtle focus:border-ink focus:outline-2 focus:outline-ink";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="min-h-12 w-full rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-canvas disabled:opacity-60">{pending ? "Sending inquiry…" : "Send order inquiry"}</button>;
}

function Quantity({ name, label, price, value, onChange }: { name: string; label: string; price: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4">
      <span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs text-muted">₱{price.toLocaleString("en-PH")} each</span></span>
      <input name={name} type="number" min="0" max="100" inputMode="numeric" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} className="w-20 rounded-lg border border-line-strong bg-elevated px-3 py-2 text-center font-mono" />
    </label>
  );
}

export function OrderForm() {
  const [state, action] = useActionState<OrderFormState, FormData>(submitOrderInquiry, {});
  const [quantities, setQuantities] = useState({ standee: 0, google: 0, facebook: 0, instagram: 0 });
  const tapCount = quantities.google + quantities.facebook + quantities.instagram;
  const total = useMemo(() => quantities.standee * STANDEE_PRICE + tapCount * TAP_CARD_PRICE, [quantities, tapCount]);

  if (state.status === "success") {
    return <div className="rounded-2xl border border-ok/30 bg-ok-soft p-6 md:p-8"><p className="eyebrow text-ok">Inquiry received</p><h2 className="mt-3 text-3xl tracking-tight">Thank you.</h2><p className="mt-3 leading-7 text-muted">{state.message}</p><p className="mt-5 text-sm">Reference: <strong className="font-mono">{state.reference}</strong></p></div>;
  }

  return (
    <form action={action} className="space-y-8">
      {state.message ? <p className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm">{state.message}</p> : null}
      <section>
        <p className="eyebrow mb-3">1 — Choose products</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Quantity name="standee_quantity" label="Google review standee" price={STANDEE_PRICE} value={quantities.standee} onChange={(standee) => setQuantities({ ...quantities, standee })} />
          <Quantity name="google_card_quantity" label="Google 3×4 tap card" price={TAP_CARD_PRICE} value={quantities.google} onChange={(google) => setQuantities({ ...quantities, google })} />
          <Quantity name="facebook_card_quantity" label="Facebook 3×4 tap card" price={TAP_CARD_PRICE} value={quantities.facebook} onChange={(facebook) => setQuantities({ ...quantities, facebook })} />
          <Quantity name="instagram_card_quantity" label="Instagram 3×4 tap card" price={TAP_CARD_PRICE} value={quantities.instagram} onChange={(instagram) => setQuantities({ ...quantities, instagram })} />
        </div>
        <p className={`mt-3 text-sm ${tapCount > 0 && tapCount < TAP_CARD_MINIMUM ? "text-warn" : "text-muted"}`}>Tap cards have a minimum of {TAP_CARD_MINIMUM} total. Mix platforms however you like.</p>
        <FormError>{state.errors?.products}</FormError>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4"><span className="text-sm text-muted">Estimated product total</span><strong className="text-2xl">₱{total.toLocaleString("en-PH")}</strong></div>
        <p className="mt-1 text-xs text-subtle">Shipping outside CDO is quoted separately.</p>
      </section>

      <section className="space-y-4">
        <p className="eyebrow">2 — Your details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[['customer_name','Your name','name'],['business_name','Business name','organization'],['mobile','Mobile number','tel'],['email','Email (optional)','email'],['city','City / municipality','address-level2'],['barangay','Barangay','address-level3']].map(([name,label,autoComplete]) => <label key={name} className="block"><span className="mb-2 block text-sm font-medium">{label}</span><input name={name} required={name !== 'email'} autoComplete={autoComplete} defaultValue={state.values?.[name]} className={FIELD} /><FormError>{state.errors?.[name]}</FormError></label>)}
        </div>
        <fieldset><legend className="mb-2 text-sm font-medium">Preferred contact</legend><div className="flex gap-4 text-sm"><label><input type="radio" name="preferred_contact" value="mobile" defaultChecked className="mr-2 accent-brand" />Mobile</label><label><input type="radio" name="preferred_contact" value="email" className="mr-2 accent-brand" />Email</label></div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-medium">Delivery area</legend><div className="grid gap-2 sm:grid-cols-2"><label className="rounded-lg border border-line p-3 text-sm"><input type="radio" name="delivery_area" value="cdo" defaultChecked className="mr-2 accent-brand" />Within CDO</label><label className="rounded-lg border border-line p-3 text-sm"><input type="radio" name="delivery_area" value="outside_cdo" className="mr-2 accent-brand" />Outside CDO</label></div></fieldset>
        <label className="block"><span className="mb-2 block text-sm font-medium">Notes <span className="text-subtle">(optional)</span></span><textarea name="customer_notes" rows={4} defaultValue={state.values?.customer_notes} placeholder="Preferred color, deadline, or questions" className={FIELD} /></label>
      </section>
      <div className="rounded-xl border border-line bg-surface p-4 text-xs leading-6 text-muted">No payment is taken here. We’ll contact you to confirm the order, complete delivery address, shipping if needed, and payment details. By submitting, you agree to our <a href="/privacy" className="underline">privacy notice</a>.</div>
      <SubmitButton />
    </form>
  );
}
