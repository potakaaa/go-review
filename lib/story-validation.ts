import { z } from "zod";

const optionalDate = z.string().trim().refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v), "Enter a valid date.").transform(v => v || null);
const optionalCount = z.preprocess(v => v === "" || v === null ? null : Number(v), z.number().int().min(0).max(2147483647).nullable());

export const storySchema = z.object({
  shop_name: z.string().trim().max(120),
  caption: z.string().trim().min(1, "Add a caption.").max(600),
  alt_text: z.string().trim().min(1, "Describe the photo.").max(300),
  installed_on: optionalDate,
  before_count: optionalCount,
  after_count: optionalCount,
  before_date: optionalDate,
  after_date: optionalDate,
  source_url: z.string().trim().refine(v => !v || /^https:\/\//.test(v) && URL.canParse(v), "Use an HTTPS source URL.").transform(v => v || null),
  display_order: z.coerce.number().int().min(0).max(10000),
  published: z.boolean(),
}).superRefine((v, ctx) => {
  const fields = [v.before_count, v.after_count, v.before_date, v.after_date];
  if (fields.some(x => x !== null) && fields.some(x => x === null)) {
    ctx.addIssue({ code: "custom", message: "For results, enter both review totals and both observation dates.", path: ["before_count"] });
  }
  if (v.before_date && v.after_date && v.before_date >= v.after_date) ctx.addIssue({ code: "custom", message: "The after date must be later than the before date.", path: ["after_date"] });
  if (v.before_count !== null && !v.shop_name) ctx.addIssue({ code: "custom", message: "Name the shop before adding results.", path: ["shop_name"] });
});

export function reviewDifference(story: { before_count: number | null; after_count: number | null }): number | null {
  return story.before_count === null || story.after_count === null ? null : story.after_count - story.before_count;
}

export const STORY_BUCKET = "shop-stories";
export const STORY_UPLOAD_LIMIT = 8 * 1024 * 1024;
