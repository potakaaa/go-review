import Image from "next/image";
import type { ShopStory } from "@/lib/database.types";
import { reviewDifference } from "@/lib/story-validation";

export function StoryResult({ story }: { story: ShopStory }) {
  const difference = reviewDifference(story);
  if (difference === null || !story.before_date || !story.after_date) return null;
  const date = (value: string) => new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="flex items-center gap-3"><span className="display-heading text-[40px] leading-none">{difference > 0 ? "+" : ""}{difference}</span><span className="text-[11px] leading-4 text-muted">Google reviews<br />during this period</span></div>
      <div className="mt-4 flex items-center justify-between gap-2"><p className="flex flex-col gap-1 text-[11px] text-muted"><span>{date(story.before_date)}</span><strong className="font-medium text-ink">{story.before_count} reviews</strong></p><span aria-hidden="true">→</span><p className="flex flex-col gap-1 text-[11px] text-muted"><span>{date(story.after_date)}</span><strong className="font-medium text-ink">{story.after_count} reviews</strong></p></div>
      {story.source_url && <a href={story.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[12px] underline underline-offset-4">View source ↗</a>}
    </div>
  );
}

export function ShopStoryCard({ story, preview = false }: { story: ShopStory; preview?: boolean }) {
  const provided = /^provided\/shop-[123]\.webp$/.test(story.image_path ?? "");
  const src = provided ? `/images/${story.image_path?.slice(9)}` : preview ? `/dashboard/stories/${story.id}/photo` : `/media/stories/${story.id}?v=${encodeURIComponent(story.updated_at)}`;
  // Public story media is readable without a session, so let Next generate
  // responsive variants. Authenticated dashboard previews must stay direct.
  //
  // The photo is absolutely sized to the 4:3 wrapper, so the explicit
  // width/height below never drive layout -- they exist so the markup carries
  // real dimensions (crawlers read them; `fill` leaves them off entirely).
  const canOptimize = provided || !preview;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
      {story.image_path && <div className="relative aspect-[4/3] overflow-hidden"><Image className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" src={src} alt={story.alt_text} width={1200} height={900} sizes="(max-width: 639px) 90vw, (max-width: 1023px) 45vw, (max-width: 1279px) 30vw, 290px" unoptimized={!canOptimize} /></div>}
      <div className="flex flex-1 flex-col p-5"><p className="eyebrow">{story.shop_name || "On the counter"}</p><p className="mt-2.5 text-[0.875rem] leading-6 text-muted">{story.caption}</p><StoryResult story={story} /></div>
    </article>
  );
}
