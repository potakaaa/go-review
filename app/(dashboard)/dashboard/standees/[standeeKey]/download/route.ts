import QRCode from "qrcode";

import { requirePermission } from "@/lib/permissions";
import { platformLabel } from "@/lib/platforms";
import { publicUrlForSlug, QR_OPTIONS, QR_PNG_SIZE, qrFileName } from "@/lib/qr";
import { STANDEE_KEY_PATTERN, standeeZipFileName } from "@/lib/standee";
import { createZip, type ZipEntry } from "@/lib/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string | number | boolean): string {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ standeeKey: string }> },
): Promise<Response> {
  const { standeeKey } = await ctx.params;

  if (!STANDEE_KEY_PATTERN.test(standeeKey)) {
    return new Response("Not found", { status: 404 });
  }

  const { supabase } = await requirePermission("routes", "view");

  const { data: routes, error } = await supabase
    .from("redirect_routes")
    .select(
      "standee_position, slug, business_name, platform, destination_url, active",
    )
    .eq("standee_key", standeeKey)
    .order("standee_position", { ascending: true });

  if (error) {
    console.error("[standee-download] route_lookup_failed", {
      code: error.code,
    });
    return new Response("Could not prepare this download.", { status: 500 });
  }

  if (!routes?.length) return new Response("Not found", { status: 404 });

  try {
    const entries: ZipEntry[] = [];

    // A stand holds at most four QRs, so these are generated in order rather
    // than through the worker pool the 100-route batch export needs.
    for (const route of routes) {
      const publicUrl = publicUrlForSlug(route.slug);
      const png = await QRCode.toBuffer(publicUrl, {
        ...QR_OPTIONS,
        width: QR_PNG_SIZE,
      });

      entries.push({
        // The platform is part of the name so the printer can tell which QR
        // belongs under which logo on the artwork.
        name:
          qrFileName(
            `${route.business_name} ${platformLabel(route.platform)}`,
            route.slug,
          ) + ".png",
        data: png,
      });
    }

    const manifest = [
      ["qr", "platform", "business_name", "slug", "public_url", "destination_url", "active"],
      ...routes.map((route) => [
        route.standee_position ?? "",
        platformLabel(route.platform),
        route.business_name,
        route.slug,
        publicUrlForSlug(route.slug),
        route.destination_url,
        route.active,
      ]),
    ];

    entries.push({
      name: "manifest.csv",
      data: new TextEncoder().encode(
        manifest.map((row) => row.map(csvCell).join(",")).join("\n") + "\n",
      ),
    });

    const archive = createZip(entries);
    const body = new ArrayBuffer(archive.byteLength);
    new Uint8Array(body).set(archive);

    return new Response(body, {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition":
          'attachment; filename="' + standeeZipFileName(standeeKey) + '"',
        "content-length": String(archive.byteLength),
        "content-type": "application/zip",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    console.error("[standee-download] qr_generation_failed");
    return new Response("Could not prepare this download.", { status: 500 });
  }
}
