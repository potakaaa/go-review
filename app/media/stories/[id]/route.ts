import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { STORY_BUCKET } from "@/lib/story-validation";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response("Not found", { status: 404 });
  const client = createPublicClient();
  const { data: story } = await client.from("shop_stories").select("image_path, updated_at").eq("id", id).eq("published", true).single();
  if (!story?.image_path) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const { data, error } = await client.storage.from(STORY_BUCKET).download(story.image_path);
  if (error || !data) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const version = new URL(request.url).searchParams.get("v");
  const cacheControl =
    version && version === story.updated_at
      ? "public, max-age=31536000, immutable"
      : "public, max-age=60, must-revalidate";
  return new Response(data, { headers: { "Content-Type": "image/webp", "Cache-Control": cacheControl, "X-Content-Type-Options": "nosniff" } });
}
