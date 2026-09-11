import QRCode from "qrcode";

import { requirePermission } from "@/lib/permissions";
import { BATCH_KEY_PATTERN, batchZipFileName } from "@/lib/batch";
import { publicUrlForSlug, QR_OPTIONS, QR_PNG_SIZE, qrFileName } from "@/lib/qr";
import { createZip, type ZipEntry } from "@/lib/zip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QR_GENERATION_CONCURRENCY = 4;

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

  const { supabase } = await requirePermission("routes", "view");

  const { data: routes, error } = await supabase
    .from("redirect_routes")
    .select(
      "batch_position, slug, business_name, destination_url, active",
    )
    .eq("batch_key", batchKey)
    .order("batch_position", { ascending: true });

  if (error) {
    console.error("[batch-download] route_lookup_failed", {
      code: error.code,
    });
    return new Response("Could not prepare this download.", { status: 500 });
  }

  if (!routes?.length) return new Response("Not found", { status: 404 });
  const routeList = routes;

  try {
    const entries = new Array<ZipEntry>(routeList.length);
    let nextIndex = 0;

    async function generateEntries(): Promise<void> {
      while (true) {
        const index = nextIndex++;
        if (index >= routeList.length) return;

        const route = routeList[index];
        const publicUrl = publicUrlForSlug(route.slug);
        const png = await QRCode.toBuffer(publicUrl, {
          ...QR_OPTIONS,
          width: QR_PNG_SIZE,
        });

        entries[index] = {
          name: qrFileName(route.business_name, route.slug) + ".png",
          data: png,
        };
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(QR_GENERATION_CONCURRENCY, routeList.length) },
        () => generateEntries(),
      ),
    );

    entries.push({ name: "manifest.csv", data: csvManifest(routeList) });

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
  } catch {
    console.error("[batch-download] qr_generation_failed");
    return new Response("Could not prepare this download.", { status: 500 });
  }
}
