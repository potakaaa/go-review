import QRCode from "qrcode";

import { BATCH_KEY_PATTERN, batchZipFileName } from "@/lib/batch";
import { publicUrlForSlug, QR_OPTIONS, QR_PNG_SIZE, qrFileName } from "@/lib/qr";
import { createClient } from "@/lib/supabase/server";
import { createZip, type ZipEntry } from "@/lib/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(value: string | number | boolean): string {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

function csvManifest(
  routes: Array<{
    batch_position: number | null;
    slug: string;
    business_name: string;
    destination_url: string;
    active: boolean;
  }>,
): Uint8Array {
  const rows = [
    [
      "position",
      "business_name",
      "slug",
      "public_url",
      "destination_url",
      "active",
    ],
    ...routes.map((route) => [
      route.batch_position ?? "",
      route.business_name,
      route.slug,
      publicUrlForSlug(route.slug),
      route.destination_url,
      route.active,
    ]),
  ];

  return new TextEncoder().encode(
    rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n",
  );
}

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ batchKey: string }> },
): Promise<Response> {
  const { batchKey } = await ctx.params;

  if (!BATCH_KEY_PATTERN.test(batchKey)) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: routes, error } = await supabase
    .from("redirect_routes")
    .select(
      "batch_position, slug, business_name, destination_url, active",
    )
    .eq("batch_key", batchKey)
    .order("batch_position", { ascending: true });

  if (error) {
    console.error("[batch-download] route lookup failed", {
      batchKey,
      message: error.message,
    });
    return new Response("Could not prepare this download.", { status: 500 });
  }

  if (!routes?.length) return new Response("Not found", { status: 404 });

  try {
    const entries: ZipEntry[] = [];

    for (const route of routes) {
      const publicUrl = publicUrlForSlug(route.slug);
      const png = await QRCode.toBuffer(publicUrl, {
        ...QR_OPTIONS,
        width: QR_PNG_SIZE,
      });

      entries.push({
        name: qrFileName(route.business_name, route.slug) + ".png",
        data: png,
      });
    }

    entries.push({ name: "manifest.csv", data: csvManifest(routes) });

    const archive = createZip(entries);
    const body = new ArrayBuffer(archive.byteLength);
    new Uint8Array(body).set(archive);

    return new Response(body, {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition":
          'attachment; filename="' + batchZipFileName(batchKey) + '"',
        "content-length": String(archive.byteLength),
        "content-type": "application/zip",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (cause) {
    console.error("[batch-download] QR generation failed", {
      batchKey,
      cause,
    });
    return new Response("Could not prepare this download.", { status: 500 });
  }
}
