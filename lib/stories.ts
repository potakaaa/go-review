import "server-only";
import { createPublicClient } from "@/lib/supabase/public";

export async function getPublishedStories() {
  try {
    const { data, error } = await createPublicClient().from("shop_stories").select("*").eq("published", true).order("display_order").order("created_at");
    if (error) {
      console.error("[stories] public_read_failed", error.code);
      return [];
    }
    return data ?? [];
  } catch {
    console.error("[stories] public_read_unavailable");
    return [];
  }
}
