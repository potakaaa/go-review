"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffMfa } from "@/lib/auth";
import { storySchema, STORY_BUCKET } from "@/lib/story-validation";
import { normalizeStoryImage } from "@/lib/story-images";
import { z } from "zod";

export type StoryFormState = { error?: string };

export async function saveStory(_state: StoryFormState, form: FormData): Promise<StoryFormState> {
  const { supabase } = await requireStaffMfa();
  const rawId = form.get("id");
  const id = rawId ? z.uuid().safeParse(rawId) : null;
  if (id && !id.success) return { error: "Invalid story." };
  const storyId = id?.success ? id.data : crypto.randomUUID();
  const parsed = storySchema.safeParse({ ...Object.fromEntries(form), published: form.get("published") === "on" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the story details." };

  let previousPath: string | null = null;
  if (id) {
    const { data, error } = await supabase.from("shop_stories").select("image_path").eq("id", storyId).single();
    if (error || !data) return { error: "This story could not be loaded. Refresh and try again." };
    previousPath = data.image_path;
  }
  let imagePath = previousPath;
  const file = form.get("photo");
  if (file instanceof File && file.size) {
    try {
      const bytes = await normalizeStoryImage(file);
      imagePath = `${storyId}/${crypto.randomUUID()}.webp`;
      const { error } = await supabase.storage.from(STORY_BUCKET).upload(imagePath, bytes, { contentType: "image/webp", upsert: false });
      if (error) return { error: "The photo could not be uploaded. Your existing story has not changed." };
    } catch (error) {
      return { error: error instanceof Error && /Choose a/.test(error.message) ? error.message : "This photo could not be read. Try a JPG, PNG, or WebP file." };
    }
  }
  if (parsed.data.published && !imagePath) return { error: "Add a photo before publishing." };
  const values = { ...parsed.data, image_path: imagePath, updated_at: new Date().toISOString() };
  const result = id
    ? await supabase.from("shop_stories").update(values).eq("id", storyId).select("id").single()
    : await supabase.from("shop_stories").insert({ id: storyId, ...values }).select("id").single();
  if (result.error) {
    if (imagePath && imagePath !== previousPath) await supabase.storage.from(STORY_BUCKET).remove([imagePath]);
    return { error: "The story could not be saved. Check your connection and try again." };
  }
  if (previousPath && !previousPath.startsWith("provided/") && previousPath !== imagePath) await supabase.storage.from(STORY_BUCKET).remove([previousPath]);
  revalidatePath("/dashboard/stories");
  revalidatePath("/");
  redirect("/dashboard/stories?saved=1");
}
