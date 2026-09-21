/**
 * Constants the browser and the server both need. They live apart from
 * `story-validation` so a client component can read the upload limit without
 * pulling the whole validation schema -- and zod -- into the page bundle.
 */
export const STORY_BUCKET = "shop-stories";
export const STORY_UPLOAD_LIMIT = 8 * 1024 * 1024;
