/**
 * Regenerates the three transparent tap-card cutouts in public/images.
 *
 * All three sources are flat 900x1200 artwork with full-bleed colour bars, so
 * the only work here is rounding the corners into the alpha channel: the cards
 * then sit on the page as real cutouts instead of rectangles with a printed
 * white margin pretending to be one.
 *
 * Run with: node tools/build-card-cutouts.mjs
 *
 * CACHE NOTE: Next's image optimizer keys its cache on the source URL, not the
 * file's contents. Rewriting a cutout in place therefore keeps serving the old
 * optimized copy. Locally, `rm -rf .next/cache/images` and restart the dev
 * server. For a change that has already shipped, bump the version suffix on
 * both the design file and its cutout (the convention the rest of
 * public/images already follows) so the URL changes with the artwork --
 * otherwise browsers and the CDN keep the stale card until their TTL expires.
 */
import sharp from "sharp";

const OUT = "public/images";
const W = 900;
const H = 1200;
const RADIUS = 38; // ~1/8in corner on a 3in-wide card

const cornerMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/>` +
    `</svg>`,
);

const CARDS = [
  ["google-tap-card-design-v1.png", "google-tap-card-cutout.png"],
  ["facebook-tap-card-design-v1.png", "facebook-tap-card-cutout.png"],
  ["instagram-tap-card-design-v1.png", "instagram-tap-card-cutout.png"],
];

const written = [];

for (const [source, file] of CARDS) {
  const flat = await sharp(`${OUT}/${source}`)
    .resize(W, H, { fit: "fill" })
    .ensureAlpha()
    .png()
    .toBuffer();

  await sharp(flat)
    .composite([{ input: cornerMask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT}/${file}`);

  written.push(file);
}

console.log(`Wrote ${written.length} cutouts:\n  ${written.join("\n  ")}`);
