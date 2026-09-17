import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { MILESTONE_CARD_SIZE, milestoneCard } from "@/components/milestone-card";
import {
  averageScansPerCard,
  milestoneFileName,
  scanMilestone,
} from "@/lib/milestone";
import { requirePermission } from "@/lib/permissions";
import { getMostUsedRoutes, getRouteStats } from "@/lib/routes";

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

  const [stats, routes] = await Promise.all([
    getRouteStats(),
    getMostUsedRoutes(3),
  ]);
  const milestone = scanMilestone(stats.totalScans);

  const card = milestoneCard({
    milestone,
    cardsLive: stats.active,
    averagePerCard: averageScansPerCard(stats.totalScans, stats.scanned),
    topRoutes: routes
      .filter((route) => route.scan_count > 0)
      .map((route) => ({
        businessName: route.business_name,
        scans: route.scan_count,
      })),
  });

  return new ImageResponse(card, {
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
