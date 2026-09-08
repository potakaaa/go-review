import Link from "next/link";
import { isSuperadmin, requirePermission } from "@/lib/permissions";
import { ButtonLink, Card } from "@/components/ui";
import { reviewDifference } from "@/lib/story-validation";

export const metadata = { title: "Shop stories" };
export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const access = await requirePermission("stories", "view");
  const { supabase } = access;
  const canManage = isSuperadmin(access) || access.permissions.stories.canManage;
  const [{ data, error }, params] = await Promise.all([supabase.from("shop_stories").select("*").order("display_order").order("created_at"), searchParams]);
  return <div className="mx-auto max-w-3xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Goreview / Website</p><h1 className="display-heading mt-3 text-4xl">Shop stories</h1><p className="mt-3 text-sm text-muted">Real counters. Observed results. Publish when ready.</p></div>{canManage ? <ButtonLink href="/dashboard/stories/new">Add story</ButtonLink> : null}</div>
    {params.saved && <p role="status" className="mb-5 text-sm text-ok">Story saved. Public changes appear within a minute.</p>}
    {error ? <Card className="p-6"><p role="alert">Shop stories could not be loaded.</p><p className="mt-2 text-sm text-muted">If this is the first setup, apply the shop-stories migration. Otherwise refresh and try again.</p></Card> : !data?.length ? <Card className="p-8"><h2 className="text-lg">Your first shop story starts here.</h2><p className="mt-3 text-sm leading-6 text-muted">Upload a counter photo and add a caption. Review totals can come later. MC Coffee’s reported +11 is awaiting dated before/after counts; publish it only once those are available.</p></Card> : <div className="space-y-3">{data.map(story => <Link href={`/dashboard/stories/${story.id}`} key={story.id} className="block rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong"><div className="flex items-center justify-between gap-4"><h2 className="font-medium">{story.shop_name || "Unnamed shop"}</h2><span className={`text-xs ${story.published ? "text-ok" : "text-muted"}`}>{story.published ? "Published" : "Draft"}</span></div><p className="mt-2 line-clamp-2 text-sm text-muted">{story.caption}</p>{reviewDifference(story) !== null && <p className="mt-3 text-sm">Review change: {reviewDifference(story)}</p>}</Link>)}</div>}
  </div>;
}
