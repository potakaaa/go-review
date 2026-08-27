import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 84,
          fontWeight: 500,
          letterSpacing: "-0.05em",
          border: "10px solid #27272a",
        }}
      >
        RR
      </div>
    ),
    size,
  );
}
