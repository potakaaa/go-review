import { notFound } from "next/navigation";
import { z } from "zod";
import { requireStaffMfa } from "@/lib/auth";
import { StoryForm } from "../story-form";
import { ShopStoryCard } from "@/components/shop-story";
import { ButtonLink } from "@/components/ui";
export const metadata = { title: "Edit shop story" };
export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { supabase } = await requireStaffMfa();
  const { data, error } = await supabase.from("shop_stories").select("*").eq("id", id).single();
  if (error || !data) notFound();
  return <div className="mx-auto max-w-2xl"><ButtonLink href="/dashboard/stories" variant="ghost">← Shop stories</ButtonLink><h1 className="display-heading my-8 text-4xl">Edit shop story</h1><details className="mb-8 rounded-xl border border-line p-5"><summary className="cursor-pointer">Preview saved story</summary><div className="mt-5"><ShopStoryCard story={data} preview /></div></details><StoryForm story={data} /></div>;
}
