import { ImageResponse } from "next/og";

/**
 * Generated at build time so the repo carries no binary icon assets -- and
 * pointedly not the Google logo, which is a trademark we have no licence to
 * ship as an app icon.
 */
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontSize: 240,
          fontWeight: 500,
          letterSpacing: "-0.05em",
          border: "24px solid #27272a",
        }}
      >
        RR
      </div>
    ),
    size,
  );
}
