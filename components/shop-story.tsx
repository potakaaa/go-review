import Image from "next/image";
import type { ShopStory } from "@/lib/database.types";
import { reviewDifference } from "@/lib/story-validation";

export function StoryResult({ story }: { story: ShopStory }) {
  const difference = reviewDifference(story);
  if (difference === null || !story.before_date || !story.after_date) return null;
  const date = (value: string) => new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="flex items-center gap-4"><span className="display-heading text-[54px] leading-none">{difference > 0 ? "+" : ""}{difference}</span><span className="text-[12px] leading-4 text-muted">Google reviews<br />during this period</span></div>
      <div className="mt-5 flex items-center justify-between gap-2.5"><p className="flex flex-col gap-1 text-[11px] text-muted"><span>{date(story.before_date)}</span><strong className="font-medium text-ink">{story.before_count} reviews</strong></p><span aria-hidden="true">→</span><p className="flex flex-col gap-1 text-[11px] text-muted"><span>{date(story.after_date)}</span><strong className="font-medium text-ink">{story.after_count} reviews</strong></p></div>
      {story.source_url && <a href={story.source_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[12px] underline underline-offset-4">View source ↗</a>}
    </div>
  );
}

export function ShopStoryCard({ story, preview = false }: { story: ShopStory; preview?: boolean }) {
  const provided = /^provided\/shop-[123]\.webp$/.test(story.image_path ?? "");
  const src = provided ? `/images/${story.image_path?.slice(9)}` : preview ? `/dashboard/stories/${story.id}/photo` : `/media/stories/${story.id}?v=${encodeURIComponent(story.updated_at)}`;
  return (
    <article className="group overflow-hidden rounded-xl border border-line bg-surface">
      {story.image_path && <div className="relative aspect-[4/5] overflow-hidden md:aspect-[3/4]"><Image className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" src={src} alt={story.alt_text} fill sizes="(max-width: 767px) 90vw, 40vw" unoptimized={!provided} /></div>}
      <div className="p-[23px] md:p-[18px] xl:p-[23px]"><p className="eyebrow">{story.shop_name || "On the counter"}</p><p className="mt-3 text-[15px] leading-6 text-muted">{story.caption}</p><StoryResult story={story} /></div>
    </article>
  );
}
