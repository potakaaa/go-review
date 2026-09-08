import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Goreview — One-time payment. Lifetime support. NFC and QR review cards from ₱699.";
export default function OpenGraphImage() {
  return new ImageResponse(<div style={{ background: "#0a0a0a", color: "#f5f5f5", width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70 }}><div style={{ display: "flex", fontSize: 35 }}>goreview.</div><div style={{ display: "flex", fontSize: 80, letterSpacing: -4, maxWidth: 950 }}>Good experiences deserve to be shared.</div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 25, color: "#a3a3a3" }}><span>One-time payment. Lifetime support.</span><span>From ₱699 ↗</span></div></div>, size);
}
