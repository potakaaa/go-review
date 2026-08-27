"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui";
import { QR_OPTIONS, QR_PNG_SIZE, qrFileName } from "@/lib/qr";

/**
 * Renders and downloads the QR code for a card.
 *
 * Every path -- preview, PNG, SVG -- encodes the same `url` prop, which comes
 * from `publicUrlForSlug`, so what you inspect on screen is byte-for-byte what
 * gets printed.
 */
export function QrPanel({
  url,
  businessName,
  slug,
}: {
  url: string;
  businessName: string;
  slug: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(url, { ...QR_OPTIONS, width: 512 })
      .then((dataUrl) => {
        if (!cancelled) setPreview(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError("Could not render this QR code.");
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  function triggerDownload(href: string, filename: string) {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function downloadPng() {
    const dataUrl = await QRCode.toDataURL(url, {
      ...QR_OPTIONS,
      width: QR_PNG_SIZE,
    });
    triggerDownload(dataUrl, `${qrFileName(businessName, slug)}.png`);
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
    const objectUrl = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml" }),
    );
    triggerDownload(objectUrl, `${qrFileName(businessName, slug)}.svg`);
    // Revoke on the next tick -- immediately would race the download starting.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-[320px]">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border border-line bg-white">
          {error ? (
            <p className="flex h-full items-center justify-center px-6 text-center text-sm text-danger">
              {error}
            </p>
          ) : preview ? (
            /* eslint-disable-next-line @next/next/no-img-element -- a data: URL
               generated in the browser; next/image would only add a round-trip. */
            <img
              src={preview}
              alt={`QR code linking to ${url}`}
              className="size-full"
            />
          ) : (
            <div className="size-full animate-pulse bg-canvas" />
          )}
        </div>
      </div>

      <p className="mt-4 break-anywhere text-center font-mono text-xs text-muted">
        {url}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <CopyButton value={url} className="col-span-2" variant="primary" />
        <Button type="button" variant="secondary" onClick={downloadPng}>
          Download PNG
        </Button>
        <Button type="button" variant="secondary" onClick={downloadSvg}>
          Download SVG
        </Button>
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-subtle">
        High error correction with a full quiet zone. Print at 25&nbsp;mm or
        larger and keep the white border clear.
      </p>
    </div>
  );
}
