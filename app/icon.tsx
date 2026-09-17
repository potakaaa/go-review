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
          background: "#1d1d1f",
          color: "#ffffff",
          fontSize: 240,
          fontWeight: 500,
          letterSpacing: "-0.05em",
          border: "24px solid #3a3a3d",
        }}
      >
        GR
      </div>
    ),
    size,
  );
}
