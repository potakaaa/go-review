import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { MILESTONE_CARD_SIZE, milestoneCard } from "@/components/milestone-card";
import { milestoneFileName, scanMilestone } from "@/lib/milestone";
import { requirePermission } from "@/lib/permissions";
import { getRouteStats } from "@/lib/routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Satori reads `ttf`/`otf`, not the `woff2` the site serves to browsers, so
 * the same two families ship a second time as static instances subset to the
 * characters this card can contain. See tools/social/README.md.
 */
const fontDirectory = join(process.cwd(), "public", "fonts");
const [interRegular, interSemiBold, bitcountMedium] = await Promise.all([
  readFile(join(fontDirectory, "inter-regular.ttf")),
  readFile(join(fontDirectory, "inter-semibold.ttf")),
  readFile(join(fontDirectory, "bitcount-medium.ttf")),
]);

export async function GET(): Promise<Response> {
  await requirePermission("analytics", "view");

  const stats = await getRouteStats();
  const milestone = scanMilestone(stats.totalScans);

  return new ImageResponse(milestoneCard(milestone), {
    ...MILESTONE_CARD_SIZE,
    fonts: [
      { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      { name: "Bitcount", data: bitcountMedium, weight: 500, style: "normal" },
    ],
    headers: {
      "cache-control": "private, no-store",
      // Inline so the page can preview it; the download link names the file.
      "content-disposition": `inline; filename="${milestoneFileName(milestone)}"`,
      "x-robots-tag": "noindex",
    },
  });
}
