import "server-only";
import { STORY_UPLOAD_LIMIT } from "@/lib/story-limits";

// sharp is a native module, and it is only ever needed while a photo is being
// uploaded. Importing it lazily keeps it out of the module graph that renders
// the story pages, so a load failure can never take a page down with it.
export async function normalizeStoryImage(file: File): Promise<Buffer> {
  if (!file.size || file.size > STORY_UPLOAD_LIMIT) throw new Error("Choose a photo smaller than 8 MB.");
  const { default: sharp } = await import("sharp");
  const bytes = Buffer.from(await file.arrayBuffer());
  const image = sharp(bytes, { limitInputPixels: 40_000_000, animated: false });
  const metadata = await image.metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
    throw new Error("Choose a JPG, PNG, or WebP photo.");
  }
  // rotate reads EXIF orientation; output drops all metadata by default.
  return image.rotate().resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
}
