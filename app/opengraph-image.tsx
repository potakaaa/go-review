import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Goreview — One-time payment. Lifetime support. NFC and QR review cards from ₱699.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          color: "#1d1d1f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 70,
          // A hairline frame keeps the card from dissolving into the white
          // background of the feed it is shared into.
          border: "1px solid #e4e4e9",
        }}
      >
        <div style={{ display: "flex", fontSize: 35, fontWeight: 600, letterSpacing: -1 }}>
          goreview.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 80,
            fontWeight: 600,
            letterSpacing: -3,
            lineHeight: 1.05,
            maxWidth: 950,
          }}
        >
          Good experiences deserve to be shared.
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 25,
            color: "#6e6e73",
          }}
        >
          <span>One-time payment. Lifetime support.</span>
          <span>From ₱699 ↗</span>
        </div>
      </div>
    ),
    size,
  );
}
