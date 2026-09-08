"use client";
import { useActionState } from "react";
import type { ShopStory } from "@/lib/database.types";
import { saveStory } from "./actions";
import { Button, FormError } from "@/components/ui";

const fieldClass = "mt-2 block w-full rounded-lg border border-line-strong bg-canvas px-3 py-3 text-ink focus:outline-2 focus:outline-ink";

export function StoryForm({ story }: { story?: ShopStory }) {
  const [state, action, pending] = useActionState(saveStory, {});
  return <form action={action} className="space-y-6">
    {story && <input type="hidden" name="id" value={story.id} />}
    <label className="block text-sm">Shop name <span className="text-muted">(optional for photo-only stories)</span><input className={fieldClass} name="shop_name" maxLength={120} defaultValue={story?.shop_name} /></label>
    <label className="block text-sm">Caption<textarea className={fieldClass} name="caption" required maxLength={600} rows={3} defaultValue={story?.caption} /></label>
    <label className="block text-sm">Photo <span className="text-muted">— JPG, PNG, WebP · up to 8 MB</span><input className={fieldClass} type="file" name="photo" accept="image/jpeg,image/png,image/webp" /><span className="mt-2 block text-xs text-muted">A new upload replaces the current photo after the story is saved.</span></label>
    <label className="block text-sm">Photo description<input className={fieldClass} name="alt_text" required maxLength={300} defaultValue={story?.alt_text} /></label>
    <div className="grid gap-5 sm:grid-cols-2"><label className="block text-sm">Card installed on <span className="text-muted">(optional)</span><input className={fieldClass} type="date" name="installed_on" defaultValue={story?.installed_on ?? ""} /></label><label className="block text-sm">Display order<input className={fieldClass} type="number" name="display_order" min={0} max={10000} defaultValue={story?.display_order ?? 0} required /></label></div>
    <fieldset className="rounded-xl border border-line p-5"><legend className="px-2 text-sm">Review results — optional</legend><p className="mb-5 text-sm leading-6 text-muted">Enter both observed totals and dates, or leave all four blank. Scans are not completed reviews. Record what you observed without attributing every review to the card.</p><div className="grid gap-5 sm:grid-cols-2">
      <label className="text-sm">Before: total reviews<input className={fieldClass} type="number" name="before_count" min={0} max={2147483647} defaultValue={story?.before_count ?? ""} /></label>
      <label className="text-sm">Before: observation date<input className={fieldClass} type="date" name="before_date" defaultValue={story?.before_date ?? ""} /></label>
      <label className="text-sm">After: total reviews<input className={fieldClass} type="number" name="after_count" min={0} max={2147483647} defaultValue={story?.after_count ?? ""} /></label>
      <label className="text-sm">After: observation date<input className={fieldClass} type="date" name="after_date" defaultValue={story?.after_date ?? ""} /></label>
    </div><label className="mt-5 block text-sm">Source URL <span className="text-muted">(optional, public when published)</span><input className={fieldClass} type="url" name="source_url" placeholder="https://" defaultValue={story?.source_url ?? ""} /></label></fieldset>
    <label className="flex gap-3 rounded-xl border border-line p-5 text-sm"><input className="mt-1 size-5 accent-white" type="checkbox" name="published" defaultChecked={story?.published ?? false} /><span>Publish on the landing page<span className="mt-1 block leading-6 text-muted">Confirm the photo and story are approved for public use. Uncheck to return to draft. Saving an already published story updates it publicly.</span></span></label>
    <FormError>{state.error}</FormError><Button type="submit" disabled={pending}>{pending ? "Saving story…" : "Save story"}</Button>
  </form>;
}
