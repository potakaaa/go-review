import { z } from "zod";
import { requireStaffMfa } from "@/lib/auth";
import { STORY_BUCKET } from "@/lib/story-validation";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireStaffMfa();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const { data: story } = await supabase.from("shop_stories").select("image_path").eq("id", id).single();
  if (!story?.image_path) return new Response("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from(STORY_BUCKET).download(story.image_path);
  if (error || !data) return new Response("Not found", { status: 404 });
  return new Response(data, { headers: { "Content-Type": "image/webp", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
}
